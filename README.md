# ContextEngine MCP Server

A Model Context Protocol (MCP) server that provides an interface to the **ContextEngine system** - a comprehensive Documentation Driven Development (DDD) methodology. This MCP server enables AI assistants to access ContextEngine's structured workflows, context management tools, and knowledge graph system for documentation-first development processes, eliminating repetitive context provision and ensuring code generation follows documented requirements.

## 🚀 What is ContextEngine?

ContextEngine is an MCP server that implements a comprehensive **Documentation Driven Development (DDD)** system. It provides structured workflows, context management, and tools that enable AI assistants and humans to collaborate effectively through documentation-first development methodologies.

### Core Philosophy

ContextEngine addresses the fundamental challenges of AI-human collaboration in software development:

- **Context Management**: Eliminates repetitive context provision by creating persistent documentation repositories
- **Quality Assurance**: Ensures code generation follows documented requirements and specifications
- **Scalability**: Handles 3x to 30x more information per person than traditional development methods
- **Business Alignment**: Maintains clear connection between technical implementation and business value

## Features

- **Documentation-Driven Workflows**: 9 standardized workflows for different development activities
- **Context Engineering**: Dynamic context composition and provision through knowledge graph
- **Structured Documentation**: Plan and task documents with hierarchical organization
- **TypeScript**: Full type safety and modern development experience
- **Authentication**: Built-in support for API keys and authentication


## 🛠️ Installation

### Requirements

- Node.js >= v18.0.0
- Cursor, Claude Code, VSCode, Windsurf or another MCP Client

### Connecting to MCP Clients

```json
"mcp": {
  "servers": {
    "context-engine": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "context-engine", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

## 🔨 Available Tools

ContextEngine provides tools for DDD workflow execution:

### 1. `start_context_engine`
Starts the ContextEngine system and returns the foundational DDD methodology documentation. This tool establishes the system awareness and provides the base methodology that governs all subsequent interactions.


<!-- ## 📋 Available Workflows

ContextEngine provides 9 standardized workflows for different development activities:

### Development Workflows
- **Plan Documentation**: Create comprehensive strategic documentation for projects or major components
- **Task Documentation**: Create detailed implementation specifications for specific work items
- **Task Implementation**: Transform documented requirements into working code following test-driven development
- **Implementation Review**: Validate implemented code against documentation and quality standards
- **Documentation Synchronization**: Maintain consistency between code and documentation as changes occur

### Supporting Workflows
- **Implementation Planning**: Define technical approach and constraints for task implementation
- **Pre-Implementation Review**: Validate task documentation before implementation begins
- **Test Implementation Review**: Validate test implementation against requirements and quality standards

### System Workflows
- **Workflow Creation**: Design and document new standardized workflows for repeatable processes -->

## CLI Arguments

Your MCP server accepts the following CLI flags:

- `--transport <stdio|http>` – Transport to use (`stdio` by default)
- `--port <number>` – Port to listen on when using `http` transport (default `3000`)
- `--api-key <key>` – API key for authentication (if needed)
- `--server-url <url>` – Custom server URL (defaults to https://contextengine.in)

## 📚 Usage

1. **Start ContextEngine**: Use the `start_context_engine` tool to initialize the DDD system
2. **Select Workflow**: Choose from 9 available workflows based on your development objective
3. **Execute Workflow**: Follow the structured workflow phases to complete your development task
4. **Integrate with AI assistants**: Connect to Cursor, VS Code, Claude Code, etc.

## 📄 License

MIT
