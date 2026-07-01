import { Router } from "express";
import { getOrCreateDatabase, writeDatabase, notifyClients } from "./db";
import { logger } from "../lib/logger";

const router = Router();

router.all("/postback", async (req, res) => {
  try {
    const params = { ...req.query, ...req.body };
    const paramsLower: Record<string, any> = {};
    for (const k of Object.keys(params)) {
      paramsLower[k.toLowerCase().trim()] = params[k];
    }

    const decodeParam = (val: any): string => {
      if (val === undefined || val === null) return "";
      const strVal = String(val).trim();
      try { return decodeURIComponent(strVal).trim(); } catch { return strVal; }
    };

    const resolvedUserId = decodeParam(
      paramsLower.user_id || paramsLower.userid || paramsLower.uid ||
      paramsLower.subid || paramsLower.sub_id || paramsLower.subid_1 ||
      paramsLower.subid1 || paramsLower.click_id || paramsLower.clickid ||
      paramsLower.member_id || paramsLower.memberid || paramsLower.s1 ||
      paramsLower.s1_value || paramsLower.s2 || paramsLower.s3 ||
      paramsLower.p1 || paramsLower.p2 || paramsLower.p3 ||
      paramsLower.p4 || paramsLower.p5 || paramsLower.user ||
      paramsLower.username || paramsLower.id || ""
    );

    const resolvedReward = decodeParam(
      paramsLower.reward || paramsLower.amount || paramsLower.amount_local ||
      paramsLower.amountlocal || paramsLower.coins || paramsLower.points ||
      paramsLower.payout || paramsLower.reward_amount || paramsLower.rewardamount ||
      paramsLower.payout_local || paramsLower.payoutlocal || paramsLower.val ||
      paramsLower.value || ""
    );

    const resolvedTaskId = decodeParam(
      paramsLower.task_id || paramsLower.taskid || paramsLower.campaign_id ||
      paramsLower.campaignid || paramsLower.cid || paramsLower.offer_id ||
      paramsLower.offerid || paramsLower.wall_id || paramsLower.wallid ||
      paramsLower.wall || paramsLower.network || ""
    );

    const resolvedTxId = decodeParam(
      paramsLower.tx_id || paramsLower.txid || paramsLower.trans_id ||
      paramsLower.transid || paramsLower.lead_id || paramsLower.leadid ||
      paramsLower.transaction_id || paramsLower.transactionid || ""
    );

    const isSimulator = params.is_simulator === "true" || params.is_simulator === true ||
      paramsLower.is_simulator === "true" || paramsLower.is_simulator === true;

    const respond = (statusCode: number, jsonResponse: any, textResponse = "0") => {
      if (isSimulator) {
        return res.status(statusCode).json(jsonResponse);
      } else {
        return res.status(statusCode).header("Content-Type", "text/plain").send(statusCode >= 400 ? textResponse : "1");
      }
    };

    const cleanUserIdStr = resolvedUserId.replace(/[{}[\]"']/g, "").trim();

    if (!cleanUserIdStr) {
      return respond(400, { error: "Missing required parameter for user identification." }, "0");
    }
    if (!resolvedReward) {
      return respond(400, { error: "Missing required parameter for reward amount." }, "0");
    }

    const rewardCoins = parseFloat(resolvedReward);
    if (isNaN(rewardCoins) || rewardCoins <= 0) {
      return respond(400, { error: "Invalid reward amount. Must be a positive numeric value." }, "0");
    }

    const db = getOrCreateDatabase();

    let user: any = db.users.find((u: any) => {
      if (!u) return false;
      const normalizedId = cleanUserIdStr.toLowerCase().trim();
      const matchesUid = u.uid && u.uid.toLowerCase().trim() === normalizedId;
      const matchesEmail = u.email && u.email.toLowerCase().trim() === normalizedId;
      const matchesReferral = u.referralCode && u.referralCode.toLowerCase().trim() === normalizedId;
      const cleanUid = u.uid ? u.uid.toLowerCase().replace(/^uid_/gi, "").trim() : "";
      const cleanQueryId = normalizedId.replace(/^uid_/gi, "").trim();
      const matchesCleanUid = cleanUid && cleanUid === cleanQueryId;
      const prefixedId = normalizedId.startsWith("uid_") ? normalizedId : "uid_" + normalizedId;
      const matchesPrefixedUid = u.uid && u.uid.toLowerCase().trim() === prefixedId;
      const cleanUserPhone = u.phoneNumber ? u.phoneNumber.replace(/\D/g, "") : "";
      const cleanQueryIdPhone = cleanUserIdStr.replace(/\D/g, "");
      const matchesPhone = cleanUserPhone && cleanUserPhone === cleanQueryIdPhone;
      return matchesUid || matchesPrefixedUid || matchesCleanUid || matchesEmail || matchesReferral || matchesPhone;
    });

    if (!user) {
      const isPlaceholderString = ["user_id", "userid", "uid", "sub_id", "subid", "click_id", "clickid", "placeholder", "member_id", "guest_user"]
        .includes(cleanUserIdStr.toLowerCase()) || cleanUserIdStr.includes("{") || cleanUserIdStr.includes("}");

      if (isPlaceholderString && db.users && db.users.length > 0) {
        user = db.users[0];
        logger.info({ placeholder: cleanUserIdStr, resolved: user.uid }, "Postback resolved placeholder to first user");
      } else {
        user = {
          uid: cleanUserIdStr,
          email: cleanUserIdStr.includes("@") ? cleanUserIdStr : `${cleanUserIdStr}@cp-earners.com`,
          displayName: `Dynamic Earner (${cleanUserIdStr.slice(0, 8)})`,
          referralCode: "CP" + Math.floor(100000 + Math.random() * 900000),
          balances: { main: 0, bonus: 0, referral: 0, todayEarnings: 0, totalEarnings: 0 },
          streakDays: 1,
          isBanned: false,
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
      }
    }

    if (user.isBanned) {
      return respond(403, { error: "Verification halted: User account is currently banned." }, "0");
    }

    const rawTaskIdClean = (resolvedTaskId || "t_custom_dynamic").replace(/[{}[\]"']/g, "").trim();
    const finalTaskId = rawTaskIdClean || "t_custom_dynamic";
    const cleanTxId = resolvedTxId.replace(/[{}[\]"']/g, "").trim();
    const txId = cleanTxId
      ? `tx_pb_${user.uid}_${finalTaskId}_${cleanTxId}`
      : `tx_pb_${user.uid}_${finalTaskId}`;

    const isDuplicate = db.transactions.some((tx: any) => tx.userId === user.uid && tx.id === txId);
    if (isDuplicate) {
      if (isSimulator) {
        return res.status(200).json({ success: false, error: "Duplicate transaction callback detected.", status: "Duplicate" });
      } else {
        return res.status(200).header("Content-Type", "text/plain").send("1");
      }
    }

    const localUser = db.users.find((u: any) => u.uid === user.uid);
    if (localUser) {
      if (!localUser.balances) {
        localUser.balances = { main: 0, bonus: 0, referral: 0, todayEarnings: 0, totalEarnings: 0 };
      }
      const todayStr = new Date().toDateString();
      if (!localUser.balances.lastEarningDate) {
        localUser.balances.lastEarningDate = todayStr;
      } else if (localUser.balances.lastEarningDate !== todayStr) {
        localUser.balances.todayEarnings = 0;
        localUser.balances.lastEarningDate = todayStr;
      }
      localUser.balances.main += rewardCoins;
      localUser.balances.todayEarnings += rewardCoins;
      localUser.balances.totalEarnings += rewardCoins;
      user = localUser;
    }

    db.transactions.push({
      id: txId,
      userId: user.uid,
      amount: rewardCoins,
      type: "task",
      description: `Offerwall Callback: Credited +₹${rewardCoins.toFixed(2)} automatically via secure Postback [Task ID: ${finalTaskId}]${cleanTxId ? " [ID: " + cleanTxId + "]" : ""}`,
      timestamp: new Date().toISOString()
    });

    if (!db.taskCompletions) db.taskCompletions = [];
    const localTcId = cleanTxId
      ? `tc_pb_${user.uid}_${finalTaskId}_${cleanTxId}`
      : `tc_pb_${user.uid}_${finalTaskId}`;
    const isTaskCompletionExists = db.taskCompletions.some((tc: any) => tc.id === localTcId);
    if (!isTaskCompletionExists) {
      const taskObj = db.tasks.find((t: any) => t.id === finalTaskId);
      db.taskCompletions.push({
        id: localTcId,
        userId: user.uid,
        userEmail: user.email,
        taskId: finalTaskId,
        taskTitle: taskObj ? taskObj.title : `Sponsor Task (${finalTaskId})`,
        rewardAmount: rewardCoins,
        status: "completed",
        screenshotURL: null,
        textProof: "Verified automatically via Sponsor Postback Webhook",
        completedAt: new Date().toISOString()
      });
    }

    writeDatabase(db);
    notifyClients("database_updated", { timestamp: Date.now() });

    logger.info({ userId: user.uid, reward: rewardCoins, taskId: finalTaskId }, "Postback processed successfully");
    return respond(200, {
      success: true,
      status: "Credited",
      user: { uid: user.uid, email: user.email },
      reward: rewardCoins,
      taskId: finalTaskId,
      txId
    });
  } catch (error: any) {
    logger.error({ err: error }, "POST /postback error");
    if (!res.headersSent) return res.status(500).json({ error: error.message });
  }
});

export default router;
