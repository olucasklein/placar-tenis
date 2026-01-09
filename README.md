# TechScore - Placar de Tênis

Aplicativo de placar profissional para tênis desenvolvido com React Native e Expo.

## 🎾 Funcionalidades

- **Placar em tempo real** - Acompanhamento de pontos, games e sets
- **Modo Singles e Doubles** - Suporte para partidas individuais e de duplas
- **Histórico de partidas** - Registro de todas as partidas com timestamps
- **Estatísticas** - Visualização de estatísticas da partida
- **Timer integrado** - Cronômetro de duração da partida
- **Cores personalizáveis** - Escolha cores para cada jogador
- **Modo escuro/claro** - Interface minimalista com fundo branco
- **Localização em português** - Interface totalmente em português
- **Suporte a botões virtuais Android** - Layout adaptativo para diferentes dispositivos

## 📋 Requisitos

### Desenvolvimiento
- **Node.js** 20+ (com npm)
- **Expo CLI** instalado globalmente (`npm install -g expo-cli`)
- **Android SDK** (para builds locais)
- **Java JDK 17+** (para compilação Android)
- **NDK 27.1.12297006** (para builds natives)

### Para rodar no dispositivo
- **Expo Go** instalado no smartphone (Android/iOS)
- **Ou** um APK compilado (Android)

## 🚀 Como Rodar o Projeto

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Iniciar o Servidor Expo

```bash
npx expo start --clear
```

Isso abrirá o menu Expo:
- **`a`** - Abrir no Android (via Expo Go)
- **`w`** - Abrir na Web
- **`r`** - Recarregar app
- **`m`** - Alternar menu
- **`?`** - Ver todos os comandos

### 3. Escanear QR Code

Se usando **Expo Go**:
1. Abra o Expo Go no seu telefone
2. Escaneie o QR code exibido no terminal
3. O app carregará automaticamente

## 🛠️ Como Buildar para Android

### Prerequisitos (primeira vez)

1. **Instalar Node.js 20+:**
   ```bash
   # No Windows (via PowerShell como admin)
   winget install OpenJS.NodeJS.LTS
   ```

2. **Instalar WSL2 com Ubuntu:**
   ```bash
   wsl --install -d Ubuntu
   ```

3. **No WSL, atualizar Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs
   ```

4. **Instalar Java JDK 17:**
   ```bash
   # Windows
   winget install Oracle.JavaRuntimeEnvironment
   ```

5. **Configurar Android SDK** (será feito automaticamente no primeiro build)

### Build Local (Gradle)

```bash
# No PowerShell/CMD
wsl -u root bash -c "export ANDROID_HOME=/usr/lib/android-sdk && cd /mnt/c/workspace/placar-tenis/android && ./gradlew assembleRelease --no-daemon"
```

**⚠️ IMPORTANTE:** Use `assembleRelease` sem o `clean`. O comando `clean` causa erro com `react-native-safe-area-context` ao tentar limpar diretórios de codegen que ainda não existem.

**Resultado:** `android/app/build/outputs/apk/release/app-release.apk` (58 MB)

### Instalar no Dispositivo

```bash
# Com ADB (Android Debug Bridge)
adb install android/app/build/outputs/apk/release/app-release.apk

# Ou transfer the APK manually para seu telefone e instale
```

## 📁 Estrutura do Projeto

```
placar-tenis/
├── src/
│   ├── screens/
│   │   ├── GameScreen.tsx       # Tela principal do placar
│   │   ├── ScoreboardScreen.tsx # Versão moderna do placar
│   │   ├── SetupScreen.tsx      # Tela de configuração
│   │   └── PlayerSetupScreen.tsx# Setup dos jogadores
│   ├── types/
│   │   └── index.ts             # Tipos TypeScript
│   └── utils/
│       ├── matchLogic.ts        # Lógica de scoring do tênis
│       ├── storage.ts           # Persistência de dados
│       └── teamHelper.ts        # Helpers de equipes
├── assets/
│   └── icon.png                 # Logo da aplicação
├── app.json                     # Configuração do Expo
├── App.tsx                      # Componente principal
├── package.json                 # Dependências
└── tsconfig.json               # Config TypeScript
```

## 🎮 Como Usar

### Tela de Configuração
1. Digite o nome de cada jogador
2. Escolha as cores dos jogadores (clique para alternar cores)
3. Selecione modo Singles ou Doubles
4. Pressione "Iniciar Partida"

### Tela de Placar
1. Use os botões grandes nas laterais para adicionar pontos
2. Pressione o **botão de menu** (hamburger) para:
   - Adicionar pontos manualmente
   - Ver estatísticas
   - Desfazer último ponto
   - Editar nomes dos jogadores
   - Finalizar partida
   - Voltar ao menu

### Menu Lateral
- **Adicionar Ponto** - Selecione o jogador que marcou ponto
- **Desfazer** - Remove o último ponto marcado
- **Estatísticas** - Visualiza stats da partida (aces, winners, etc)
- **Editar** - Muda os nomes dos jogadores
- **Histórico** - Lista todos os pontos marcados
- **Nova Partida** - Inicia uma nova partida
- **Finalizar** - Encerra a partida atual

## 🌐 Tecnologias

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma para apps React Native
- **TypeScript** - Tipagem estática
- **AsyncStorage** - Persistência local de dados
- **Expo Vector Icons** - Ícones da interface
- **Gradle** - Build system Android

## 📱 Compatibilidade

- **Android:** 7.0+ (API 24+)
- **iOS:** 12.0+ (via Expo)
- **Web:** Funciona em navegadores modernos

## 🔧 Troubleshooting

### Erro "externalNativeBuildCleanRelease FAILED"
O comando `./gradlew clean` causa erro com a biblioteca `react-native-safe-area-context`. Use apenas `./gradlew assembleRelease` sem o `clean`.

### "useSafeAreaInsets is not exported"
Certifique-se que `App.tsx` está envolvido com `<SafeAreaProvider>` da biblioteca `react-native-safe-area-context`.

### Build Gradle falha
1. Verifique se `ANDROID_HOME` está configurado
2. Reinicie o WSL: `wsl --shutdown`
3. Use `./gradlew assembleRelease` (sem clean)

### APK não instala
1. Desinstale versão anterior: `adb uninstall com.anonymous.techscore`
2. Tente novamente: `adb install app-release.apk`

### Expo não conecta
1. Reinicie o Expo: `Ctrl+C` e `npx expo start --clear`
2. Verifique se está na mesma rede WiFi
3. Abra firewall para porta 8081

## 📝 Notas Desenvolvimento

- App usa **AsyncStorage** para persistência (não requer backend)
- Cada partida é salva automaticamente
- Histórico limitado a 50 partidas para otimizar storage
- Modo landscape forçado na tela de placar
- Suporte a safe area para notched devices e botões virtuais

## 🎯 Roadmap

- [ ] Exportar estatísticas em PDF
- [ ] Sincronização cloud (Firebase)
- [ ] Modo online multiplayer
- [ ] Análise de vídeo integrada
- [ ] Integração com rankings

## 📄 Licença

Propriedade privada - Todos os direitos reservados

## 👨‍💻 Autor

Desenvolvido com React Native e Expo

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Última Atualização:** 09/01/2026
