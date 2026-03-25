# Greek Social Media Agent

## Deploy σε Vercel (5 λεπτά)

### Βήμα 1 — Κατέβασε τον κώδικα
Αποθήκευσε αυτόν τον φάκελο στον υπολογιστή σου.

### Βήμα 2 — Εγκατάσταση dependencies
Άνοιξε terminal μέσα στον φάκελο και τρέξε:
```
npm install
```

### Βήμα 3 — Πάρε Anthropic API Key
1. Πήγαινε στο https://console.anthropic.com
2. Φτιάξε λογαριασμό (δωρεάν)
3. Πήγαινε API Keys → Create Key
4. Αντέγραψε το key (ξεκινά με sk-ant-...)

### Βήμα 4 — Deploy στο Vercel
1. Πήγαινε στο https://vercel.com
2. New Project → "Import" ή drag & drop τον φάκελο
3. Πριν κάνεις deploy, πήγαινε **Environment Variables**
4. Πρόσθεσε:
   - Name: `ANTHROPIC_API_KEY`
   - Value: το key σου (sk-ant-...)
5. Πάτα **Deploy**

### Έτοιμο!
Παίρνεις ένα link όπως: `https://greek-agent-xxx.vercel.app`
Μοιράσου το με όποιον θες.

---

## Τοπική δοκιμή (προαιρετικό)
Φτιάξε αρχείο `.env.local` με:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Μετά τρέξε:
```
npm run dev
```
Άνοιξε http://localhost:3000
