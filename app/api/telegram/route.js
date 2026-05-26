export async function POST(req) {
  try {
    const body = await req.json();

    const {
      cliente,
      data_operativa,
    } = body;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const messaggio = `
📦 Nuovo ordine ricevuto

Cliente: ${cliente}
Data operativa: ${data_operativa}

Apri gestione ordini:
https://ordini-boutique-2-0.vercel.app/gestione-ordini
`;

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messaggio,
        }),
      }
    );

    const data = await response.json();

    return Response.json(data);

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Errore invio Telegram" },
      { status: 500 }
    );
  }
}