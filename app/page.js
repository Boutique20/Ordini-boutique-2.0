export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>
          Boutique 2.0
        </h1>

        <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 28 }}>
          Selezione Premium – Gestione Ordini Clienti
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          
          {/* GESTIONE */}
          <a
            href="/gestione-ordini"
            style={btn("#2563eb")}
          >
            Gestione Ordini
          </a>

          {/* STAMPE */}
          <a
            href="/stampa/andrea"
            style={btn("#16a34a")}
          >
            Stampa Andrea
          </a>

          <a
            href="/stampa/raffaele"
            style={btn("#22c55e")}
          >
            Stampa Raffaele
          </a>

          <a
            href="/stampa/totale"
            style={btn("#0ea5e9")}
          >
            Stampa Totale
          </a>

        </div>
      </div>
    </div>
  );
}

/* FUNZIONE PER BOTTONI */
function btn(color) {
  return {
    backgroundColor: color,
    padding: "14px",
    borderRadius: 10,
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
    display: "block",
    textAlign: "center",
  };
}