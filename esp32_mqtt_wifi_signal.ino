#include <WiFi.h>
#include <PubSubClient.h>

// ============ CONFIGURAÇÕES DE REDE ============
const char* ssid = "IPhone de Ana Julia";
const char* password = "anajuliaa";

// ============ CONFIGURAÇÕES MQTT ============
// Broker MQTT público (EMQX)
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;

// Tópico MQTT onde os dados serão publicados
const char* mqtt_topic = "inteli/wifi_signal/rssi";

// ID único para este dispositivo
const char* client_id = "esp32_wifi_monitor";

// ============ VARIÁVEIS GLOBAIS ============
WiFiClient espClient;
PubSubClient client(espClient);

// Variáveis para controle de tempo
unsigned long lastPublishTime = 0;
const unsigned long publishInterval = 2000; // Publicar a cada 2 segundos (em ms)

// Variáveis para armazenar dados
int rssi_value = 0;
char msg_buffer[50];

// ============ FUNÇÃO DE SETUP ============
void setup() {
  // Inicializar comunicação serial para debug
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("Iniciando ESP32 - WiFi Signal Monitor");
  Serial.println("========================================");
  
  // Configurar WiFi
  setup_wifi();
  
  // Configurar cliente MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqtt_callback);
  
  Serial.println("Setup concluído!");
}

// ============ FUNÇÃO PRINCIPAL (LOOP) ============
void loop() {
  // Garantir que está conectado ao WiFi
  if (!WiFi.isConnected()) {
    Serial.println("WiFi desconectado! Tentando reconectar...");
    setup_wifi();
  }
  
  // Garantir que está conectado ao MQTT
  if (!client.connected()) {
    reconnect_mqtt();
  }
  
  // Manter a conexão MQTT ativa
  client.loop();
  
  // Publicar dados em intervalos regulares
  if (millis() - lastPublishTime >= publishInterval) {
    publish_wifi_signal();
    lastPublishTime = millis();
  }
}

// ============ FUNÇÃO: CONECTAR AO WIFI ============
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  if (WiFi.isConnected()) {
    Serial.println("WiFi conectado!");
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("Falha ao conectar ao WiFi!");
  }
}

// ============ FUNÇÃO: RECONECTAR AO MQTT ============
void reconnect_mqtt() {
  int attempts = 0;
  while (!client.connected() && attempts < 5) {
    Serial.print("Tentando conectar ao MQTT broker (");
    Serial.print(mqtt_server);
    Serial.print(")...");
    
    if (client.connect(client_id)) {
      Serial.println(" Conectado!");
      
      // Se conectou, publicar uma mensagem de status
      client.publish(mqtt_topic, "ESP32 conectado ao broker MQTT");
      
      // Subscrever a um tópico de controle (opcional para futuras expansões)
      // client.subscribe("inteli/wifi_signal/control");
    } else {
      Serial.print(" Falha (código: ");
      Serial.print(client.state());
      Serial.println(")");
      delay(2000);
      attempts++;
    }
  }
}

// ============ FUNÇÃO: CALLBACK MQTT ============
// Esta função é chamada quando uma mensagem é recebida em um tópico subscrito
void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensagem recebida no tópico: ");
  Serial.println(topic);
  
  Serial.print("Payload: ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

// ============ FUNÇÃO: PUBLICAR SINAL WIFI ============
void publish_wifi_signal() {
  // Ler o valor de RSSI (Received Signal Strength Indicator)
  // RSSI é dado em dBm (decibéis relativos a 1 miliwatt)
  // Valores típicos variam de -30 dBm (muito forte) a -90 dBm (muito fraco)
  rssi_value = WiFi.RSSI();
  
  // Converter para string com formato JSON para facilitar parsing no dashboard
  snprintf(msg_buffer, sizeof(msg_buffer), "{\"rssi\":%d,\"timestamp\":%lu}", 
           rssi_value, millis());
  
  // Publicar a mensagem
  if (client.publish(mqtt_topic, msg_buffer)) {
    Serial.print("Publicado: ");
    Serial.print(msg_buffer);
    Serial.print(" | Status WiFi: ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println("Falha ao publicar mensagem!");
  }
}

// ============ INFORMAÇÕES ÚTEIS ============
/*
 * RSSI (Received Signal Strength Indicator):
 * - Valor em dBm (decibéis relativos a 1 miliwatt)
 * - Quanto MAIS NEGATIVO, mais fraco o sinal
 * - Quanto MENOS NEGATIVO (mais próximo de 0), mais forte o sinal
 * 
 * Interpretação típica:
 * -30 dBm: Excelente (muito próximo do roteador)
 * -50 dBm: Muito bom
 * -70 dBm: Bom
 * -80 dBm: Fraco
 * -90 dBm: Muito fraco (conexão pode ser perdida)
 * 
 * Gaiola de Faraday (Elevador):
 * - Estrutura metálica bloqueia sinais de radiofrequência
 * - Esperado: queda significativa de RSSI dentro do elevador
 * - Esperado: recuperação do sinal ao sair do elevador
 * 
 * Tópico MQTT:
 * - inteli/wifi_signal/rssi
 * - Formato: {"rssi":-XX,"timestamp":XXXXX}
 * - Publicado a cada 2 segundos
 */
