"use client";

import React, { useMemo, useState } from "react";

type Status = "idle" | "confirm" | "loading" | "success" | "error";

const monthNames = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

export default function LiquidacionesUI() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1; // 1-12
  const [month, setMonth] = useState(defaultMonth);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const monthLabel = useMemo(() => monthNames[month - 1], [month]);

  const submitToWebhook = async () => {
    setStatus("loading");
    setMessage("");
    
    try {
      const res = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year: currentYear })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "No se pudo enviar el webhook");
      }
      
      setStatus("success");
      setMessage(`Liquidación de ${monthLabel} ${currentYear} enviada. Timestamp: ${data.timestamp.slice(0, 19)}Z`);
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message ?? "Error inesperado");
    }
  };

  return (
    <div style={styles.container}>
      <link 
        href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" 
        rel="stylesheet"
      />
      <div style={styles.card}>
        <h1 style={styles.title}>Generar liquidación</h1>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Mes:
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={styles.select}
              disabled={status === "loading"}
            >
              {monthNames.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </label>

          <div style={styles.yearDisplay}>
            <span style={styles.yearLabel}>Año:</span>
            <span style={styles.yearValue}>{currentYear}</span>
          </div>
        </div>

        <button
          onClick={() => setStatus("confirm")}
          style={styles.button}
          disabled={status === "loading"}
        >
          Generar liquidación
        </button>

        {status === "confirm" && (
          <div style={styles.modalBackdrop} onClick={() => setStatus("idle")}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginTop: 0 }}>¿Confirmar?</h2>
              <p>¿Estás seguro que deseas generar la liquidación de <b>{monthLabel} {currentYear}</b>?</p>
              <div style={styles.modalActions}>
                <button onClick={() => setStatus("idle")} style={styles.secondary}>
                  Cancelar
                </button>
                <button onClick={submitToWebhook} style={styles.primary}>
                  Sí, generar
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <span>Generando y enviando…</span>
          </div>
        )}

        {(status === "success" || status === "error") && (
          <div style={status === "success" ? styles.alertSuccess : styles.alertError}>
            {message}
          </div>
        )}

        {(status === "success" || status === "error") && (
          <button 
            onClick={() => setStatus("idle")} 
            style={{
              ...styles.button, 
              marginTop: 16, 
              background: "#8be0f4",
              color: "#1f2022",
              boxShadow: "0 4px 12px rgba(139,224,244,0.3)"
            }}
          >
            Reiniciar
          </button>
        )}

        <footer style={styles.footer}>
          <small>Este envío activará tu webhook en Make con el mes, año y timestamp ISO.</small>
        </footer>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(31,32,34,0.15)",
    padding: 32,
  },
  title: { 
    fontSize: 28, 
    margin: "0 0 24px",
    fontWeight: 600,
    color: "#1f2022",
    textAlign: "center" as const
  },
  inputGroup: {
    display: "flex",
    gap: 16,
    marginBottom: 24,
    alignItems: "end"
  },
  label: { 
    display: "flex", 
    flexDirection: "column" as const,
    gap: 8, 
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    color: "#2e1f6a"
  },
  yearDisplay: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    alignItems: "center",
    minWidth: 80
  },
  yearLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "#2e1f6a"
  },
  yearValue: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1f2022",
    background: "#e5f973",
    padding: "8px 16px",
    borderRadius: 8,
    border: "2px solid #2e1f6a"
  },
  select: { 
    padding: "12px 16px", 
    borderRadius: 8, 
    border: "2px solid #2e1f6a",
    fontSize: 14,
    color: "#1f2022",
    background: "#ffffff",
    fontFamily: "inherit"
  },
  button: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: 12,
    border: "none",
    background: "#2e1f6a",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 16,
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(46,31,106,0.3)"
  },
  loadingWrap: { 
    display: "flex", 
    alignItems: "center", 
    gap: 12, 
    marginTop: 20,
    color: "#2e1f6a",
    fontSize: 14,
    justifyContent: "center",
    fontWeight: 500
  },
  spinner: {
    width: 24, 
    height: 24, 
    border: "3px solid #8be0f4", 
    borderTopColor: "#2e1f6a",
    borderRadius: "50%", 
    animation: "spin 1s linear infinite"
  },
  footer: { 
    marginTop: 20, 
    color: "#2e1f6a",
    fontSize: 12,
    textAlign: "center" as const,
    fontWeight: 400
  },
  alertSuccess: {
    marginTop: 20, 
    padding: 16, 
    borderRadius: 12,
    background: "#e5f973", 
    color: "#1f2022", 
    border: "2px solid #2e1f6a",
    fontSize: 14,
    fontWeight: 500,
    textAlign: "center" as const
  },
  alertError: {
    marginTop: 20, 
    padding: 16, 
    borderRadius: 12,
    background: "#ffe5e5", 
    color: "#1f2022", 
    border: "2px solid #ff6b6b",
    fontSize: 14,
    fontWeight: 500,
    textAlign: "center" as const
  },
  modalBackdrop: {
    position: "fixed" as const, 
    inset: 0, 
    background: "rgba(31,32,34,0.7)",
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 16,
    zIndex: 1000
  },
  modal: {
    width: "100%", 
    maxWidth: 460, 
    background: "#ffffff", 
    borderRadius: 16,
    padding: 28, 
    boxShadow: "0 20px 40px rgba(31,32,34,0.3)",
    border: "2px solid #2e1f6a"
  },
  modalActions: { 
    display: "flex", 
    justifyContent: "flex-end", 
    gap: 12, 
    marginTop: 20 
  },
  primary: {
    padding: "12px 20px", 
    borderRadius: 10, 
    border: "none",
    background: "#2e1f6a", 
    color: "#ffffff", 
    cursor: "pointer", 
    fontWeight: 600,
    fontSize: 14,
    fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(46,31,106,0.3)"
  },
  secondary: {
    padding: "12px 20px", 
    borderRadius: 10, 
    border: "2px solid #2e1f6a",
    background: "#ffffff", 
    color: "#2e1f6a", 
    cursor: "pointer", 
    fontWeight: 600,
    fontSize: 14,
    fontFamily: "inherit"
  }
};
