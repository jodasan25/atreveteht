import { useState, useEffect } from 'react';

// Simulated Connection Pool Manager
class SimulatedConnectionPool {
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  activeConnections: number = 0;
  idleConnections: number;
  totalConnections: number = 0; // Tracking total created

  constructor(config: { max: number, idleTimeoutMillis: number, connectionTimeoutMillis: number }) {
    this.max = config.max;
    this.idleTimeoutMillis = config.idleTimeoutMillis;
    this.connectionTimeoutMillis = config.connectionTimeoutMillis;
    this.idleConnections = config.max;
  }

  async connect() {
    if (this.activeConnections >= this.max) {
      throw new Error(`Timeout: Max connections (${this.max}) reached`);
    }
    
    // Simulate connection acquisition time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    this.activeConnections++;
    this.idleConnections--;
    this.totalConnections++;
    this.notifyListeners();
    
    return {
      query: async (text: string, params?: any[]) => {
        // Simulate query latency
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
        return { rows: [] };
      },
      release: () => {
        if (this.activeConnections > 0) {
          this.activeConnections--;
          this.idleConnections++;
          this.notifyListeners();
        }
      }
    };
  }

  async query(text: string, params?: any[]) {
    const client = await this.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }

  private listeners: (() => void)[] = [];
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  private notifyListeners() {
    this.listeners.forEach(l => l());
  }
}

export const dbPool = new SimulatedConnectionPool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

export function useDbPoolStats() {
  const [stats, setStats] = useState({
    active: dbPool.activeConnections,
    idle: dbPool.idleConnections,
    max: dbPool.max
  });

  useEffect(() => {
    return dbPool.subscribe(() => {
      setStats({
        active: dbPool.activeConnections,
        idle: dbPool.idleConnections,
        max: dbPool.max
      });
    });
  }, []);

  return stats;
}
