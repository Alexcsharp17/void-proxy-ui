import React, { useState, useEffect } from 'react';

interface RequestLog {
  id: number;
  city: string;
  node: string;
  latency: number;
  timestamp: string;
}

const CITIES = [
  'LONDON',
  'TOKYO',
  'NEW YORK',
  'PARIS',
  'BERLIN',
  'SINGAPORE',
  'SYDNEY',
  'DUBAI',
  'MOSCOW',
  'SAO PAULO',
  'AMSTERDAM',
  'HONG KONG',
  'TORONTO',
  'SEOUL',
  'MUMBAI',
];

const NODES = ['RESIDENTIAL', 'DATACENTER', 'ISP', 'MOBILE'];

const MAX_LOGS = 4;
const ROW_HEIGHT = 28;

export const LiveRequests: React.FC = () => {
  const [logs, setLogs] = useState<RequestLog[]>([]);

  useEffect(() => {
    const generateLog = () => {
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const nodeType = NODES[Math.floor(Math.random() * NODES.length)];
      const nodeId = Math.floor(Math.random() * 999);
      const latency = Math.floor(Math.random() * 150) + 10;

      const newLog: RequestLog = {
        id: Date.now(),
        city,
        node: `${city}_${nodeType}_${nodeId}`,
        latency,
        timestamp: new Date().toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setLogs((prev) => [...prev, newLog].slice(-MAX_LOGS));
    };

    const interval = setInterval(generateLog, 2000);
    generateLog();

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="font-label text-[10px] md:text-[12px] leading-tight border-t border-border-main pt-6"
      style={{ minHeight: MAX_LOGS * ROW_HEIGHT + 24 }}
    >
      <div className="space-y-2" style={{ minHeight: MAX_LOGS * ROW_HEIGHT }}>
        {logs.map((log, index) => {
          const opacities = [0.5, 0.7, 0.85, 1];
          const opacity = opacities[index] ?? 0.5;
          return (
            <div
              key={log.id}
              className="flex justify-between text-text-secondary transition-opacity duration-300 ease-out"
              style={{
                opacity,
                height: ROW_HEIGHT,
                minHeight: ROW_HEIGHT,
              }}
            >
              <div className="flex gap-2 md:gap-4 overflow-hidden min-w-0">
                <span className="text-accent-primary shrink-0">[LIVE]</span>
                <span className="text-[9px] md:text-[10px] opacity-70 shrink-0">{log.timestamp}</span>
                <span className="font-mono tracking-wider truncate">
                  <span className="text-accent-violet">{log.node}</span>
                </span>
              </div>
              <span
                className={`${log.latency > 100 ? 'text-red-400' : 'text-accent-violet'} font-mono shrink-0 ml-2`}
              >
                {log.latency}ms
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
