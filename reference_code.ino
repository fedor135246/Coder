void setup() {
  // Инициализация кода выполняется один раз при запуске
  Serial.begin(9600);
  pinMode(13, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(11, OUTPUT);
  
  Serial.println("Программа запущена!");
}

void loop() {
  // Основной цикл выполняется постоянно
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
  
  digitalWrite(12, HIGH);
  delay(300);
  digitalWrite(12, LOW);
  delay(300);
  
  digitalWrite(11, HIGH);
  delay(100);
  digitalWrite(11, LOW);
  delay(100);
  
  Serial.println("Светодиоды мигают...");
}
