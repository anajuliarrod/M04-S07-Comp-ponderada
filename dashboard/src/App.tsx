import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

interface SignalData {
  timestamp: number;
  rssi: number;
  time: string;
}

export default function App() {
  const [data, setData] = useState<SignalData[]>([]);
  const [currentRssi, setCurrentRssi] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [maxRssi, setMaxRssi] = useState<number | null>(null);
  const [minRssi, setMinRssi] = useState<number | null>(null);

  useEffect(() => {
    const loadMqttClient = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mqtt@5.3.0/dist/mqtt.min.js';
        script.async = true;
        script.onload = ( ) => {
          initMqtt();
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Erro ao carregar MQTT.js:', error);
        setConnectionStatus('Erro ao carregar MQTT.js');
      }
    };

    loadMqttClient();
  }, []);

  const initMqtt = () => {
    try {
      const mqtt = (window as any).mqtt;
      if (!mqtt) {
        console.error('MQTT.js não foi carregado corretamente');
        setConnectionStatus('MQTT.js não disponível');
        return;
      }

      const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
        clientId: 'esp32_dashboard_' + Math.random().toString(16).substr(2, 9),
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      client.on('connect', () => {
        console.log('Conectado ao broker MQTT!');
        setIsConnected(true);
        setConnectionStatus('Conectado');
        
        client.subscribe('inteli/wifi_signal/rssi', (err: any) => {
          if (err) {
            console.error('Erro ao subscrever:', err);
          } else {
            console.log('Subscrito ao tópico: inteli/wifi_signal/rssi');
          }
        });
      });

      client.on('message', (_topic: any, message: any) => {
        try {
          const payload = JSON.parse(message.toString());
          const rssi = payload.rssi;
          
          if (typeof rssi === 'number') {
            setCurrentRssi(rssi);
            
            setMaxRssi((prev) => (prev === null ? rssi : Math.max(prev, rssi)));
            setMinRssi((prev) => (prev === null ? rssi : Math.min(prev, rssi)));
            
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR');
            
            setData((prevData) => {
              const newData = [...prevData, {
                timestamp: now.getTime(),
                rssi: rssi,
                time: timeString,
              }];
              
              if (newData.length > 60) {
                return newData.slice(-60);
              }
              return newData;
            });
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      });

      client.on('error', (error: any) => {
        console.error('Erro MQTT:', error);
        setConnectionStatus('Erro de conexão');
      });

      client.on('disconnect', () => {
        console.log('Desconectado do broker MQTT');
        setIsConnected(false);
        setConnectionStatus('Desconectado');
      });

      client.on('reconnect', () => {
        console.log('Tentando reconectar...');
        setConnectionStatus('Reconectando...');
      });
    } catch (error) {
      console.error('Erro ao inicializar MQTT:', error);
      setConnectionStatus('Erro ao inicializar');
    }
  };

  const getSignalQuality = (rssi: number | null) => {
    if (rssi === null) return { label: 'N/A', color: '#999', bgColor: '#f5f5f5' };
    if (rssi >= -50) return { label: 'Excelente', color: '#27ae60', bgColor: '#d5f4e6' };
    if (rssi >= -70) return { label: 'Muito Bom', color: '#2ecc71', bgColor: '#d5f4e6' };
    if (rssi >= -80) return { label: 'Bom', color: '#f39c12', bgColor: '#fef5e7' };
    if (rssi >= -90) return { label: 'Fraco', color: '#e67e22', bgColor: '#fdebd0' };
    return { label: 'Muito Fraco', color: '#e74c3c', bgColor: '#fadbd8' };
  };

  const quality = getSignalQuality(currentRssi);

  return (
    <div className="app">
      <div className="container">
        <h1>Dashboard de Sinal WiFi</h1>
        <p className="subtitle">Monitoramento em tempo real da potência do sinal WiFi (dBm) via MQTT</p>

        <div className="status-grid">
          <div className="card">
            <h3>Status MQTT</h3>
            <p className={isConnected ? 'connected' : 'disconnected'}>
              {connectionStatus}
            </p>
            <small>broker.hivemq.io</small>
          </div>

          <div className="card" style={{ backgroundColor: quality.bgColor }}>
            <h3>RSSI Atual</h3>
            <p style={{ color: quality.color }}>
              {currentRssi !== null ? `${currentRssi} dBm` : 'N/A'}
            </p>
            <small style={{ color: quality.color }}>{quality.label}</small>
          </div>

          <div className="card">
            <h3>Estatísticas</h3>
            <div className="stats-inline">
              <div>
                <small>Máximo:</small>
                <p>{maxRssi !== null ? `${maxRssi} dBm` : 'N/A'}</p>
              </div>
              <div>
                <small>Mínimo:</small>
                <p>{minRssi !== null ? `${minRssi} dBm` : 'N/A'}</p>
              </div>
              <div>
                <small>Pontos:</small>
                <p>{data.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h2>Gráfico de Sinal WiFi (Tempo × dBm)</h2>
          <p className="chart-subtitle">Últimos 60 segundos de dados em tempo real</p>
          
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  domain={[-100, -20]}
                  label={{ value: 'dBm', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                  formatter={(value) => `${value} dBm`}
                  labelFormatter={(label) => `Hora: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rssi" 
                  stroke="#3b82f6" 
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                  name="Potência do Sinal"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>Aguardando dados do ESP32...</p>
              <small>Certifique-se de que o ESP32 está conectado e publicando dados</small>
            </div>
          )}
        </div>

        <div className="info-box">
          <strong>ℹ️ Sobre o projeto:</strong> Este dashboard conecta ao broker MQTT público (broker.hivemq.com) 
          e consome dados publicados pelo ESP32. O gráfico mostra a potência do sinal WiFi em dBm em tempo real.
        </div>
      </div>
    </div>
  );
}
