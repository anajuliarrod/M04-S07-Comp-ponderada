# Dashboard de Sinal WiFi com ESP32 e MQTT

##Resumo do Projeto

Este projeto mede a potência do sinal WiFi em dBm usando um ESP32, publica os dados via MQTT em tempo real, e exibe em um dashboard web interativo com gráfico contínuo.

---

## Testes a Realizar

### Teste 1: Próximo ao Roteador
- Coloque o ESP32 perto do roteador
- RSSI esperado: -30 a -70 dBm
- Qualidade: Excelente
- Duração: 45 segundos

### Teste 2: Distante do Roteador
- Mova o ESP32 para longe do roteador
- RSSI esperado: -80 a -90 dBm
- Qualidade: Fraco
- Duração: 45 segundos

### Teste 3: Gaiola de Faraday (Elevador)
- Leve o ESP32 para dentro de um elevador
- RSSI esperado: -100+ dBm ou desconectado
- Fique dentro por **mínimo 5 segundos**
- Saia e observe a recuperação do sinal
- Duração: 90-120 segundos

**O gráfico deve mostrar:**
- Teste 1: Valores altos (menos negativos)
- Teste 2: Valores mais baixos (mais negativos)
- Teste 3: Vale pronunciado (queda dentro do elevador, recuperação ao sair)

---

## (Vídeo de Demonstração)[] 
---
## Interpretação dos Dados

| RSSI (dBm) | Qualidade | Descrição |
|-----------|-----------|-----------|
| -30 a -50 | Excelente | Muito próximo ao roteador |
| -50 a -70 | Muito Bom | Boa cobertura |
| -70 a -80 | Bom | Cobertura aceitável |
| -80 a -90 | Fraco | Sinal fraco |
| < -90 | Muito Fraco | Sinal muito fraco |
| Desconectado | N/A | Sem sinal (gaiola de Faraday) |

---

## Informações Técnicas

**Broker MQTT:** HiveMQ Public
- Servidor: `broker.hivemq.com`
- Porta: `1883` (TCP) / `8884` (WebSocket)
- Tópico: `inteli/wifi_signal/rssi`
- Formato: `{"rssi":-XX,"timestamp":XXXXX}`

**Credenciais WiFi:**
- SSID: `IPhone de Ana Julia`
- Password: `anajuliaa`

**Tecnologias:**
- ESP32 (Hardware)
- Arduino IDE (Programação)
- React + TypeScript (Frontend)
- Recharts (Gráficos)
- MQTT.js (Comunicação)

---
