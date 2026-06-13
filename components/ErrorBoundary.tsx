"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          backgroundColor: "#0c0c0c",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#ff4444",
          fontFamily: "var(--font-mono)",
          padding: "20px"
        }}>
          <h1 style={{ fontSize: "24px", letterSpacing: "2px", marginBottom: "16px", textTransform: "uppercase" }}>
            System Error
          </h1>
          <p style={{ color: "#aaaaaa", marginBottom: "32px", textAlign: "center", maxWidth: "600px" }}>
            A critical failure occurred during telemetry processing. Please restart the interface sequence.
          </p>
          <button
            onClick={this.handleReload}
            className="btn-ghost"
            style={{
              padding: "12px 32px",
              border: "1px solid #ff4444",
              color: "#ff4444",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              letterSpacing: "2px",
              textTransform: "uppercase"
            }}
          >
            Reload Interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
