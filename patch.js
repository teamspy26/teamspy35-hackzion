const fs = require('fs');
let code = fs.readFileSync('app/client/page.tsx', 'utf8');

// Add IPetPlan and AIPlan types
code = code.replace(
  /interface PetPlan \{([\s\S]*?)\}/,
  `interface PetPlan {$1}\n\ninterface AIPlan {\n  eta: number\n  vehicle: string\n  route: string\n  alternate_route: string\n  route_eta: number\n  alternate_route_eta: number\n  delay_risk: 'low' | 'medium' | 'high'\n  cost: number\n  assigned_driver: string\n  analysis: string\n}`
);

// Add state hooks for Freight Plan
code = code.replace(
  /const \[activeSection, setActiveSection\] = useState\('pet'\)/,
  `const [activeSection, setActiveSection] = useState('pet')\n  const [freightPlan, setFreightPlan] = useState<AIPlan | null>(null)\n  const [cargoType, setCargoType] = useState('Standard')\n  const [priority, setPriority] = useState('medium')`
);

// Add handleFreightCheck
code = code.replace(
  /async function handleCheck\(\) \{/,
  `async function handleFreightCheck() {\n    if (!source || !destination || !distance || !weight) {\n      alert('Please fill all freight fields')\n      return\n    }\n    setLoading(true)\n    setFreightPlan(null)\n    setSaved(false)\n    try {\n      const res = await fetch('/api/ai-plan', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({\n          source,\n          destination,\n          distance: Number(distance),\n          weight: Number(weight),\n          priority,\n        }),\n      })\n      const json = await res.json()\n      setFreightPlan(json.data)\n    } catch {\n      alert('Failed to analyze. Please try again.')\n    }\n    setLoading(false)\n  }\n\n  async function handleFreightBookWithNegotiation(finalPrice: number) {\n    if (!freightPlan) return\n    setSaving(true)\n    try {\n      await createShipment({\n        source, destination,\n        distance: Number(distance),\n        weight: Number(weight),\n        priority,\n        eta: freightPlan.eta,\n        delay_risk: freightPlan.delay_risk,\n        vehicle: freightPlan.vehicle,\n        route: freightPlan.route,\n        status: 'quote_pending',\n        negotiated_price: finalPrice,\n        assigned_driver: freightPlan.assigned_driver,\n        ai_analysis: freightPlan.analysis,\n        cargo_type: cargoType,\n      })\n    } catch {\n      // fallback\n    }\n    setSaving(false)\n    setSaved(true)\n    setTimeout(() => setSaved(false), 6000)\n  }\n\n  async function handleCheck() {`
);

// Replace the fallback UI container
const newFreightUI = `
            <div className="flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-7">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">📦</span>
                    <h1 className="text-4xl font-bold text-[#111111] leading-tight">General Freight<br />AI Planner</h1>
                  </div>
                  <p className="text-zinc-500 text-sm ml-10">AI-optimized routes, smart cost estimates & dynamic capacity</p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-5">
                {/* ── FORM ── */}
                <div className="col-span-4 flex flex-col gap-4">
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center"><Package size={14} className="text-white" /></div>
                      <h2 className="font-bold text-[#111111]">Cargo Details</h2>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Origin City</label>
                        <input type="text" placeholder="e.g. Mumbai" value={source} onChange={e => setSource(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Destination City</label>
                        <input type="text" placeholder="e.g. Pune" value={destination} onChange={e => setDest(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Distance (km)</label>
                          <input type="number" placeholder="150" value={distance} onChange={e => setDistance(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Weight (kg)</label>
                          <input type="number" placeholder="1000" value={weight} onChange={e => setWeight(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Cargo Type</label>
                          <select value={cargoType} onChange={e => setCargoType(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                            <option value="Standard">Standard</option>
                            <option value="Pallets">Pallets</option>
                            <option value="Fragile">Fragile</option>
                            <option value="Hazmat">Hazmat</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Priority</label>
                          <select value={priority} onChange={e => setPriority(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleFreightCheck} disabled={loading}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-60">
                      {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing…</> : <><Sparkles size={16} />Generate AI Plan</>}
                    </button>
                  </div>
                </div>

                {/* ── AI PLAN RESULT ── */}
                <div className="col-span-8">
                  <div className="card h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center"><Navigation size={14} className="text-white" /></div>
                      <h2 className="font-bold text-[#111111]">AI Analysis & Routing</h2>
                    </div>
                    {!freightPlan && !loading && (
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="text-5xl">🤖</div>
                        <p className="text-zinc-400 text-sm">Enter cargo details & click <strong className="text-zinc-600">Generate AI Plan</strong><br/>to calculate optimal routes and costs.</p>
                      </div>
                    )}
                    {loading && (
                      <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <div className="relative w-16 h-16 text-blue-500">
                          <Loader2 size={64} className="animate-spin" />
                        </div>
                        <p className="text-sm font-semibold text-[#111111]">Computing logicistics constraints…</p>
                      </div>
                    )}
                    {freightPlan && !loading && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 p-4 rounded-xl space-y-3">
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Route</p>
                          <div className="font-bold text-[#111111]">{freightPlan.route}</div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">ETA</span>
                            <span className="font-bold text-[#111111]">{freightPlan.eta} min</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Vehicle</span>
                            <span className="font-bold text-[#111111]">{freightPlan.vehicle}</span>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl flex flex-col justify-between">
                           <div>
                             <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">AI Recommendation</p>
                             <p className="text-sm text-blue-900 leading-relaxed">{freightPlan.analysis}</p>
                           </div>
                           <div className="mt-3 text-right">
                             <div className="text-xs text-blue-500 mb-1">Estimated Cost</div>
                             <div className="text-2xl font-black text-blue-700">₹{freightPlan.cost.toLocaleString()}</div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── NEGOTIATION BOX ── */}
                <div className="col-span-12 mt-2 mb-2">
                  {(!freightPlan || !source || !destination || !distance || !weight) ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                      <div className="text-4xl text-zinc-300">💬</div>
                      <h3 className="font-bold text-zinc-600">AI Sales Negotiator</h3>
                      <p className="text-zinc-400 text-sm font-medium">Generate an AI Plan first to negotiate a dynamic rate.</p>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <NegotiationBox
                         source={source}
                         destination={destination}
                         weight={Number(weight)}
                         baseCost={freightPlan.cost}
                         onAgreeDeal={(price) => handleFreightBookWithNegotiation(price)}
                      />
                    </div>
                  )}
                </div>

                {/* ── SHIPMENT TRACKING MAP ── */}
                {freightPlan && source && destination && (
                  <div className="col-span-12 card !p-0 overflow-hidden mt-4 mb-8">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
                      <div>
                        <h2 className="font-bold text-[#111111]">Live Shipment Tracking</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Route · Estimated arrival · Current position</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-zinc-600">{source} → {destination}</span>
                        <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Planning Phase</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <ClientMap shipment={{
                        id: 'FREIGHT-TRACK',
                        source, destination,
                        distance: Number(distance),
                        weight: Number(weight),
                        priority: priority as any,
                        eta: freightPlan.eta,
                        delay_risk: freightPlan.delay_risk,
                        vehicle: freightPlan.vehicle,
                        route: freightPlan.route,
                        status: 'pending',
                        assigned_driver: freightPlan.assigned_driver,
                        ai_analysis: freightPlan.analysis,
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>`;

code = code.replace(
  /<div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50 m-6">[\s\S]*?<Package size=\{64\} className="text-zinc-300 mb-6" \/>[\s\S]*?<\/div>/,
  newFreightUI
);

fs.writeFileSync('app/client/page.tsx', code);
console.log('Done replacement');
