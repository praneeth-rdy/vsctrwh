# Custom Chat Interface Extension

A VS Code extension that disables the built-in chat interface and provides a custom chat experience with a modern, user-friendly interface.

## Features

* **Disables Built-in Chat**: Automatically disables VS Code's built-in AI chat features on activation
* **Custom Chat Interface**: Beautiful, modern chat interface built with webview technology
* **Command Override**: Overrides VS Code's default chat commands to open the custom interface instead
* **Keyboard Shortcut**: Quick access via `Ctrl+Shift+C` (or `Cmd+Shift+C` on macOS)
* **Modern UI**: Clean, responsive design that matches VS Code's theme
* **Extensible**: Easy to integrate with any chat API or service

## Requirements

* VS Code version 1.107.0 or higher

## Installation

1. Install the extension from the VS Code marketplace (when published)
2. Or build from source:
   ```bash
   npm install
   npm run compile
   ```

## Usage

### Opening the Chat

You can open the custom chat interface in several ways:

1. **Keyboard Shortcut**: Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on macOS)
2. **Command Palette**: 
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type "Open Custom Chat" and select it
3. **VS Code Chat Commands**: The extension automatically intercepts VS Code's built-in chat commands and opens the custom interface instead

### Using the Chat

* Type your message in the input field
* Press `Enter` to send (or `Shift+Enter` for a new line)
* Click the "Send" button to send messages
* Use "Clear Chat" to reset the conversation

## Extension Settings

This extension contributes the following settings:

* `vsctrwh.disableBuiltInChat`: Enable/disable the built-in chat features (default: `true`)

## How It Works

1. **On Activation**: The extension automatically sets `chat.disableAIFeatures` to `true` in VS Code settings, which disables the built-in chat interface.

2. **Command Override**: The extension registers handlers for VS Code's built-in chat commands (`workbench.action.chat.open` and `workbench.action.chat.openInEditor`) to redirect them to the custom chat interface.

3. **Custom Webview**: The chat interface is implemented as a VS Code webview panel, providing a fully customizable UI that can be integrated with any backend service.

## Customization

To integrate with your own chat API or service, modify the `handleChatMessage` function in `src/extension.ts` and update the JavaScript in the webview HTML to make API calls instead of using the placeholder responses.

## Known Issues

* The extension attempts to disable built-in chat at both workspace and user levels. Some settings may require user confirmation.
* The chat interface currently uses placeholder responses. You'll need to integrate with your preferred chat API or service.

## Release Notes

### 0.0.1

Initial release of Custom Chat Interface Extension:
* Disables VS Code's built-in chat features
* Provides custom chat webview interface
* Overrides built-in chat commands
* Modern, theme-aware UI design

## Development

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm test
```

### Packaging

```bash
npm run package
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Specify your license here]

---

## For more information

* [VS Code Extension API](https://code.visualstudio.com/api)
* [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
* [Webview API Documentation](https://code.visualstudio.com/api/extension-guides/webview)

**Enjoy your custom chat experience!**
