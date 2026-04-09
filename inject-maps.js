const fs = require('fs');

// Update Client Page
let client = fs.readFileSync('app/client/page.tsx', 'utf8');
if (!client.includes('MapWidget')) {
  client = client.replace(/import {([^}]+)} from 'lucide-react'/, "import {$1} from 'lucide-react'\nimport MapWidget from '@/components/MapWidget'");
  client = client.replace(/(\s*)(<div className="card bg-brand-yellow\/10 border border-brand-yellow\/20">)/, 
    `$1<div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-[#111111]">Live Tracking Map</h2>
      </div>
      <MapWidget 
        center={{lat: 12.9716, lng: 77.5946}}
        zoom={6}
        markers={[
          { id: 'origin', lat: 12.9716, lng: 77.5946, type: 'origin', label: 'Origin' },
          { id: 'driver', lat: 13.0827, lng: 80.2707, type: 'driver', label: 'Current Location' }
        ]}
        route={[{lat: 12.9716, lng: 77.5946}, {lat: 13.0500, lng: 79.0000}, {lat: 13.0827, lng: 80.2707}]}
        className="h-80 w-full rounded-xl overflow-hidden"
      />
    </div>$1$2`);
  fs.writeFileSync('app/client/page.tsx', client);
}

// Update Driver Page
let driver = fs.readFileSync('app/driver/page.tsx', 'utf8');
if (!driver.includes('MapWidget')) {
  driver = driver.replace(/import {([^}]+)} from 'lucide-react'/, "import {$1} from 'lucide-react'\nimport MapWidget from '@/components/MapWidget'");
  driver = driver.replace(/(<div className="col-span-2 flex flex-col gap-6">)/, 
    `$1
      <div className="card overflow-hidden p-0">
        <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <h2 className="font-bold text-[#111111]">AI Navigation & Path Risk Analysis</h2>
            </div>
        </div>
        <div className="h-[350px] relative">
          <MapWidget 
            center={{lat: 12.9716, lng: 77.5946}}
            zoom={7}
            markers={[
              { id: 'driver', lat: 12.9716, lng: 77.5946, type: 'driver', label: 'You are here' },
              { id: 'destination', lat: 13.0827, lng: 80.2707, type: 'destination', label: 'Dropoff' }
            ]}
            route={[{lat: 12.9716, lng: 77.5946}, {lat: 13.0500, lng: 79.0000}, {lat: 13.0827, lng: 80.2707}]}
            alternativeRoute={[{lat: 12.9716, lng: 77.5946}, {lat: 12.5000, lng: 78.5000}, {lat: 13.0827, lng: 80.2707}]}
            riskLevel="HIGH"
            className="h-full w-full"
          />
        </div>
      </div>`);
  fs.writeFileSync('app/driver/page.tsx', driver);
}

// Update Operator Page
let operator = fs.readFileSync('app/operator/page.tsx', 'utf8');
if (!operator.includes('MapWidget')) {
  operator = operator.replace(/import {([^}]+)} from 'lucide-react'/, "import {$1} from 'lucide-react'\nimport MapWidget from '@/components/MapWidget'");
  operator = operator.replace(/(<div className="grid grid-cols-5 gap-6">)/, 
    `<div className="card p-0 overflow-hidden mb-6">
       <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <span className="text-xl">🌍</span>
           <h2 className="font-bold text-[#111111]">Live Fleet Tracking</h2>
         </div>
         <span className="text-xs bg-brand-yellow/20 text-yellow-800 px-3 py-1.5 rounded-full font-bold">4 Active Deliveries</span>
       </div>
       <div className="h-[400px] w-full relative">
         <MapWidget 
            center={{lat: 20.5937, lng: 78.9629}}
            zoom={4}
            markers={[
              { id: 'v1', lat: 12.9716, lng: 77.5946, type: 'driver', label: 'SH-012' },
              { id: 'v2', lat: 28.7041, lng: 77.1025, type: 'driver', label: 'SH-018' },
              { id: 'v3', lat: 19.0760, lng: 72.8777, type: 'driver', label: 'SH-041' },
              { id: 'v4', lat: 13.0827, lng: 80.2707, type: 'destination', label: 'Hub B' }
            ]}
            className="h-full w-full"
          />
       </div>
     </div>
     $1`);
  fs.writeFileSync('app/operator/page.tsx', operator);
}
console.log('Map integration successful!');