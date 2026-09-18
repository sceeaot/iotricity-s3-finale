# TASK 05 - Component Shop and Receipt

## What you are doing
Teams spend Breach Credits to buy components. Each purchase generates a
unique receipt with a receipt ID. Team shows this receipt physically at the
dispatch desk to claim the component.

---

## Helper: lib/generateReceiptId.js

```js
export function generateReceiptId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NB-${timestamp}-${random}`;
}
```

---

## API: app/api/shop/components/route.js

Returns all components and which ones the team has already purchased.

```js
import connectDB from '@/lib/mongodb';
import Component from '@/models/Component';
import Purchase from '@/models/Purchase';
import Team from '@/models/Team';
import { requireTeam } from '@/lib/requireAuth';

export async function GET() {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();

  const components = await Component.find({});
  const team = await Team.findById(auth.user.id);

  const purchases = await Purchase.find({ teamId: team._id });
  const purchasedIds = purchases.map((p) => p.componentId.toString());

  const result = components.map((c) => ({
    _id: c._id,
    name: c.name,
    cyberpunkName: c.cyberpunkName,
    price: c.price,
    description: c.description,
    purchased: purchasedIds.includes(c._id.toString()),
    receiptId: purchases.find(
      (p) => p.componentId.toString() === c._id.toString()
    )?.receiptId || null,
  }));

  return Response.json({ components: result, teamCoins: team.coins });
}
```

---

## API: app/api/shop/buy/route.js

```js
import connectDB from '@/lib/mongodb';
import Component from '@/models/Component';
import Purchase from '@/models/Purchase';
import Team from '@/models/Team';
import Transaction from '@/models/Transaction';
import { requireTeam } from '@/lib/requireAuth';
import { generateReceiptId } from '@/lib/generateReceiptId';

export async function POST(req) {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { componentId } = await req.json();

  await connectDB();

  const team = await Team.findById(auth.user.id);
  const component = await Component.findById(componentId);

  if (!component) {
    return Response.json({ error: 'Component not found' }, { status: 404 });
  }

  // Check already purchased
  const existing = await Purchase.findOne({ teamId: team._id, componentId });
  if (existing) {
    return Response.json({ error: 'Already purchased' }, { status: 400 });
  }

  // Check coins
  if (team.coins < component.price) {
    return Response.json({ error: 'Not enough coins' }, { status: 400 });
  }

  // Deduct coins
  await Team.updateOne({ _id: team._id }, { $inc: { coins: -component.price } });

  // Create purchase
  const receiptId = generateReceiptId();
  const purchase = await Purchase.create({
    receiptId,
    teamId: team._id,
    teamName: team.teamName,
    componentId: component._id,
    componentName: component.name,
    cyberpunkName: component.cyberpunkName,
    pricePaid: component.price,
  });

  // Log transaction
  await Transaction.create({
    teamId: team._id,
    type: 'spent',
    amount: -component.price,
    reason: `Purchased ${component.cyberpunkName} (${component.name})`,
  });

  return Response.json({ success: true, receiptId: purchase.receiptId });
}
```

---

## API: app/api/shop/receipt/[id]/route.js

```js
import connectDB from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import { requireTeam } from '@/lib/requireAuth';

export async function GET(req, { params }) {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();

  const purchase = await Purchase.findOne({ receiptId: params.id });

  if (!purchase) {
    return Response.json({ error: 'Receipt not found' }, { status: 404 });
  }

  // Only the purchasing team can view their own receipt
  if (purchase.teamId.toString() !== auth.user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return Response.json({ purchase });
}
```

---

## Page: app/(team)/shop/page.js

```js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Shop() {
  const [data, setData] = useState(null);
  const [buying, setBuying] = useState(null);
  const router = useRouter();

  async function fetchComponents() {
    const res = await fetch('/api/shop/components');
    if (res.status === 401) { router.push('/login'); return; }
    const json = await res.json();
    setData(json);
  }

  useEffect(() => { fetchComponents(); }, []);

  async function handleBuy(componentId, name, price) {
    const confirmed = confirm(`Buy ${name} for ${price} BC?`);
    if (!confirmed) return;

    setBuying(componentId);

    const res = await fetch('/api/shop/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentId }),
    });

    const json = await res.json();
    setBuying(null);

    if (json.success) {
      router.push(`/receipt/${json.receiptId}`);
    } else {
      alert(json.error);
    }
  }

  if (!data) return <div style={{ padding: '40px' }}>Loading...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px' }}>Component Shop</h1>
        <span style={{ color: '#aaa' }}>
          Balance: <strong style={{ color: '#fff' }}>{data.teamCoins} BC</strong>
        </span>
      </div>

      <p style={{ color: '#555', marginBottom: '24px', fontSize: '12px' }}>
        Purchase components with your Breach Credits. Show the receipt at the
        dispatch desk to claim the physical component.
      </p>

      {data.components.map((c) => (
        <div key={c._id} style={{
          border: '1px solid #333',
          padding: '20px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: c.purchased ? '#0a0a0a' : '#000',
        }}>
          <div>
            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{c.cyberpunkName}</p>
            <p style={{ color: '#555', fontSize: '13px' }}>{c.name}</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ marginBottom: '8px', color: '#aaa' }}>{c.price} BC</p>
            {c.purchased ? (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <span style={{ color: '#44ff88', fontSize: '12px' }}>Purchased</span>
                <a
                  href={`/receipt/${c.receiptId}`}
                  style={{ fontSize: '12px', color: '#aaa' }}
                >
                  View Receipt
                </a>
              </div>
            ) : (
              <button
                onClick={() => handleBuy(c._id, c.cyberpunkName, c.price)}
                disabled={buying === c._id || data.teamCoins < c.price}
                style={{
                  opacity: data.teamCoins < c.price ? 0.3 : 1,
                  cursor: data.teamCoins < c.price ? 'not-allowed' : 'pointer',
                }}
              >
                {buying === c._id ? 'Processing...' : 'Redeem'}
              </button>
            )}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '32px' }}>
        <a href="/dashboard">Back to Dashboard</a>
      </div>
    </div>
  );
}
```

---

## Page: app/(team)/receipt/[id]/page.js

```js
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Receipt() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/shop/receipt/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPurchase(data.purchase);
      });
  }, [id]);

  if (error) return <div style={{ padding: '40px', color: '#ff4444' }}>{error}</div>;
  if (!purchase) return <div style={{ padding: '40px' }}>Loading...</div>;

  const purchasedAt = new Date(purchase.purchasedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div style={{ padding: '60px', maxWidth: '460px', margin: '0 auto' }}>
      <div style={{ border: '1px solid #333', padding: '32px', fontFamily: 'monospace' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
            EE STUDENTS CHAPTER
          </p>
          <h2 style={{ fontSize: '18px', letterSpacing: '2px' }}>IoTRICITY SEASON 3</h2>
          <p style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
            COMPONENT DISPATCH RECEIPT
          </p>
        </div>

        <hr style={{ borderColor: '#333', marginBottom: '24px' }} />

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['Receipt ID', purchase.receiptId],
              ['Team', purchase.teamName],
              ['Component', purchase.cyberpunkName],
              ['', `(${purchase.componentName})`],
              ['Price Paid', `${purchase.pricePaid} BC`],
              ['Purchased At', purchasedAt],
              ['Status', purchase.dispatched ? 'DISPATCHED' : 'PENDING DISPATCH'],
            ].map(([label, value], i) => (
              <tr key={i}>
                <td style={{
                  color: '#555',
                  fontSize: '12px',
                  paddingBottom: '10px',
                  paddingRight: '16px',
                  verticalAlign: 'top',
                  whiteSpace: 'nowrap'
                }}>
                  {label}
                </td>
                <td style={{
                  fontSize: '13px',
                  paddingBottom: '10px',
                  color: label === 'Status'
                    ? purchase.dispatched ? '#44ff88' : '#ffaa00'
                    : '#fff'
                }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={{ borderColor: '#333', margin: '24px 0' }} />

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#555', lineHeight: '1.6' }}>
          Show this receipt at the Component Dispatch Desk.<br />
          Receipt ID must match for component to be released.
        </p>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
        <a href="/shop">Back to Shop</a>
        <button onClick={() => window.print()}>Print Receipt</button>
      </div>
    </div>
  );
}
```

---

## Done when:
- [ ] /shop loads with all 4 components and current coin balance
- [ ] Components with insufficient coins show as greyed out / disabled
- [ ] Buying a component deducts coins and redirects to receipt page
- [ ] Receipt page shows all purchase details clearly
- [ ] Already purchased components show "Purchased" and "View Receipt" link
- [ ] Print button works on receipt page

---

## Next task: README-06-admin-dashboard.md
