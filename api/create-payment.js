import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, name } = req.body;

  // Replace these with your real PhonePe credentials
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const merchantKey = process.env.PHONEPE_MERCHANT_KEY;

  const txnId = "TXN" + Date.now();
  const callbackUrl = "https://your-frontend-url/student/payment-success"; // optional
  const payload = {
    merchantId,
    transactionId: txnId,
    amount: amount * 100, // in paise
    merchantOrderId: "order" + Date.now(),
    message: `Payment for ${name}`,
    redirectUrl: callbackUrl
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const checksum = crypto
    .createHash("sha256")
    .update(base64Payload + "/pg/v1/pay" + merchantKey)
    .digest("hex");
  const finalChecksum = checksum + "###1";

  const response = await fetch("https://api.phonepe.com/apis/hermes/pg/v1/pay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": finalChecksum
    },
    body: JSON.stringify({ request: base64Payload })
  });

  const result = await response.json();

  return res.status(200).json({
    redirectUrl: result?.data?.instrumentResponse?.redirectInfo?.url || ""
  });
}
