const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// رابط Formspree الخاص بك
const FORMSPREE_URL = "https://formspree.io/f/xzeddwyr";

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// تقديم ملفات الموقع (ضع index.html بجانب server.js)
app.use(express.static(__dirname));

// الصفحة الرئيسية -> نموذج الاتصال
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// استقبال بيانات نموذج الاتصال وإعادة توجيهها إلى Formspree
app.post("/api/contact", async (req, res) => {
  try {
    const { name, message } = req.body || {};

    // التحقق من الحقول المطلوبة
    if (!name || !name.trim() || !message || !message.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "الاسم والرسالة حقلان مطلوبان" });
    }

    // الحمولة المُرسلة إلى Formspree
    const payload = {
      name: name.trim(),
      message: message.trim(),
      _subject: "رسالة جديدة من نموذج الاتصال (Prototype)", // يظهر كعنوان للرسالة في لوحة Formspree
      page: req.headers.referer || "contact-page",
      time: new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }),
    };

    const r = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json", // مطلوبة لكي يرد Formspree بـ JSON بدل إعادة التوجيه
      },
      body: JSON.stringify(payload),
    });

    if (r.ok) {
      return res.json({ ok: true });
    }

    // Formspree رفض الطلب — نمرّر تفاصيل الخطأ للمساعدة في التشخيص
    const detail = await r.text().catch(() => "");
    console.error("Formspree rejected:", r.status, detail);
    return res
      .status(502)
      .json({ ok: false, error: `فورم سبري رفض الطلب (HTTP ${r.status})` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "خطأ في السيرفر" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ السيرفر شغال على: http://localhost:${PORT}`);
});
