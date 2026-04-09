const fs = require('fs');

const files = [
  'app/admin/page.tsx',
  'app/client/page.tsx',
  'app/driver/page.tsx',
  'app/operator/page.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');

  // useAuth
  if (!c.includes('useAuth')) {
    c = c.replace(/import {.*} from 'react'/, (m) => m + "\nimport { useAuth } from '@/context/AuthContext'");
  }

  // LogOut import
  if (!c.includes('LogOut')) {
    c = c.replace(/import \{([\s\S]*?)\} from 'lucide-react'/, (match, group) => {
      return `import {${group}, LogOut } from 'lucide-react'`;
    });
  }

  // Inject hook
  c = c.replace(/function (AdminDashboardContent|ClientContent|DriverDashboard|OperatorDashboardContent|OperatorDashboard)\(\) \{/, (m) => {
    if (!c.includes('const { logout } = useAuth()')) {
      return m + "\n  const { logout } = useAuth()";
    }
    return m;
  });

  // Try again to catch any other variants (Driver uses "DriverContent" maybe? Admin uses AdminDashboardContent)
  // Let's just do:
  c = c.replace(/function ([A-Za-z]+Content|DriverDashboard|AdminDashboard|ClientPageContent|ClientPage)\(\) \{/, (m) => {
    if (!c.includes('const { logout } = useAuth()') && c.includes(m)) {
      return m + "\n  const { logout } = useAuth()";
    }
    return m;
  });


  // Inject button
  const headerRegex = /(<div className="flex items-start justify-between mb-7">[\s\S]*?<\/div>)/;
  c = c.replace(headerRegex, (m) => {
    if (m.includes('onClick={logout}')) return m;
    return m + `
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-brand-yellow rounded-full text-black font-bold text-lg shadow-sm border border-yellow-200">
                👤
              </div>
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-all border border-red-200">
                <LogOut size={16} />
                Logout
              </button>
            </div>`;
  });

  fs.writeFileSync(f, c);
});
console.log('Logout buttons updated!');
