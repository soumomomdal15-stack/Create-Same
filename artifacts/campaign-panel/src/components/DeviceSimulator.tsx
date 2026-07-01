import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

interface DeviceSimulatorProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
}

export default function DeviceSimulator({ children, theme }: DeviceSimulatorProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number>(84);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    const bInt = setInterval(() => {
      setBatteryLevel(b => Math.max(b > 10 ? b - 1 : 95, 12));
    }, 60000);
    return () => {
      clearInterval(interval);
      clearInterval(bInt);
    };
  }, []);

  return (
    <div className="w-full h-dvh sm:h-auto sm:min-h-0 flex flex-col items-center justify-center sm:p-4 bg-transparent select-none overflow-hidden">
      <div className="relative w-full h-dvh sm:h-[780px] sm:w-[390px] sm:max-w-[390px] bg-transparent sm:bg-slate-950 sm:rounded-[50px] p-0 sm:p-3 sm:shadow-2xl sm:border-4 sm:border-slate-800 transition-all duration-300 sm:ring-12 sm:ring-slate-900/60 sm:ring-offset-4 sm:ring-offset-slate-100 sm:dark:ring-offset-slate-950 flex flex-col overflow-hidden">
        <div className="hidden sm:flex absolute top-5 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-3xl z-40 items-center justify-between px-4">
          <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full border border-zinc-800"></div>
          <p className="text-[10px] text-zinc-400 font-mono tracking-widest pl-1">EarnOS</p>
          <div className="w-1.5 h-1.5 bg-sky-900/40 rounded-full"></div>
        </div>

        <div className={`relative w-full h-full flex-1 sm:rounded-[38px] overflow-hidden flex flex-col transition-colors duration-300 select-none ${
          theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-zinc-900'
        }`}>
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {children}
          </div>

          <div className="h-6 pb-2 flex items-center justify-center z-30 bg-transparent">
            <div className={`w-32 h-1 rounded-full ${theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300'}`}></div>
          </div>
        </div>

        <div className="hidden sm:block absolute left-[-10px] top-32 w-1.5 h-12 bg-slate-800 rounded-r-md"></div>
        <div className="hidden sm:block absolute left-[-10px] top-48 w-1.5 h-12 bg-slate-800 rounded-r-md"></div>
        <div className="hidden sm:block absolute right-[-10px] top-40 w-1.5 h-18 bg-slate-800 rounded-l-md"></div>
      </div>

      <span className="hidden sm:flex text-[11px] text-zinc-400 font-mono mt-3 select-none items-center gap-1">
        <Smartphone className="w-3 h-3 text-zinc-400" /> Interactive Mobile Emulator. Screen size responsive.
      </span>
    </div>
  );
}
