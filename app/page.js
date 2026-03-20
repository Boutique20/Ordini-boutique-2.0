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
          <a
            href="/gestione-ordini"
            style={{
              backgroundColor: "#2563eb",
              padding: "14px",
              borderRadius: 10,
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              display: "block",
            }}
          >
            Gestione Ordini
          </a>

          <a
            href="/ordine/4-gatti"
            style={{
              backgroundColor: "#f59e0b",
              padding: "14px",
              borderRadius: 10,
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              display: "block",
            }}
          >
            Pagina Ordine Cliente
          </a>

          <a
            href="/stampa/andrea"
            style={{
              backgroundColor: "#16a34a",
              padding: "14px",
              borderRadius: 10,
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              display: "block",
            }}
          >
            Stampa Andrea
          </a>
        </div>
      </div>
    </div>
  );
}