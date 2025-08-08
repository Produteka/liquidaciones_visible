import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { month, year } = await req.json() as { month?: number, year?: number };
    
    if (!month || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, error: "Mes inválido" }, { status: 400 });
    }
    
    if (!year || year < 2000) {
      return NextResponse.json({ ok: false, error: "Año inválido" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    
    // ✨ CAPTURAR INFORMACIÓN DEL USUARIO Y DISPOSITIVO
    const headers = req.headers;
    
    // Información del dispositivo y navegador
    const userAgent = headers.get('user-agent') || 'Unknown';
    const deviceInfo = parseUserAgent(userAgent);
    
    // Información de red e IP
    const clientIP = headers.get('x-forwarded-for')?.split(',')[0] || 
                     headers.get('x-real-ip') || 
                     headers.get('cf-connecting-ip') || // Cloudflare
                     'Unknown';
    
    // Información de ubicación (proporcionada por Vercel)
    const country = headers.get('x-vercel-ip-country') || 'Unknown';
    const city = headers.get('x-vercel-ip-city') || 'Unknown';
    const region = headers.get('x-vercel-ip-country-region') || 'Unknown';
    const timezone = headers.get('x-vercel-ip-timezone') || 'Unknown';
    
    // Información de la sesión
    const sessionId = generateSessionId();
    const referrer = headers.get('referer') || 'Direct';
    const language = headers.get('accept-language')?.split(',')[0] || 'Unknown';
    
    // Datos completos para el webhook
    const webhookData = {
      // Datos originales
      month,
      year,
      timestamp,
      
      // ✨ INFORMACIÓN DEL USUARIO
      user: {
        ip: clientIP,
        country,
        city,
        region,
        timezone,
        sessionId,
        language
      },
      
      // ✨ INFORMACIÓN DEL DISPOSITIVO
      device: {
        userAgent,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        os: deviceInfo.os,
        osVersion: deviceInfo.osVersion,
        device: deviceInfo.device,
        isMobile: deviceInfo.isMobile,
        isTablet: deviceInfo.isTablet,
        isDesktop: deviceInfo.isDesktop
      },
      
      // ✨ INFORMACIÓN DE LA SESIÓN
      session: {
        referrer,
        source: 'notion-embed',
        timestamp: timestamp,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      }
    };

    const url = process.env.MAKE_WEBHOOK_URL;

    if (!url) {
      return NextResponse.json({ ok: false, error: "Falta MAKE_WEBHOOK_URL en variables de entorno" }, { status: 500 });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookData)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Webhook respondió ${res.status}. ${text}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ 
      ok: true, 
      month, 
      year, 
      timestamp,
      sessionId // Para debugging si lo necesitas
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}

// 🔧 FUNCIÓN PARA PARSEAR USER AGENT
function parseUserAgent(userAgent: string) {
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/.test(userAgent);
  const isTablet = /iPad|Tablet|PlayBook/.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  // Detectar browser y versión
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (userAgent.includes('Chrome/')) {
    browser = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || '';
  } else if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || '';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    browserVersion = userAgent.match(/Version\/([0-9.]+)/)?.[1] || '';
  } else if (userAgent.includes('Edge/')) {
    browser = 'Edge';
    browserVersion = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || '';
  }
  
  // Detectar OS y versión
  let os = 'Unknown';
  let osVersion = '';
  
  if (userAgent.includes('Windows NT')) {
    os = 'Windows';
    const winVersion = userAgent.match(/Windows NT ([0-9.]+)/)?.[1];
    osVersion = getWindowsVersion(winVersion || '');
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
    osVersion = userAgent.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    osVersion = userAgent.match(/Android ([0-9.]+)/)?.[1] || '';
  } else if (userAgent.includes('iPhone OS') || userAgent.includes('OS ')) {
    os = 'iOS';
    osVersion = userAgent.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
  }
  
  // Detectar dispositivo específico
  let device = 'Desktop';
  if (userAgent.includes('iPhone')) device = 'iPhone';
  else if (userAgent.includes('iPad')) device = 'iPad';
  else if (userAgent.includes('Android') && isMobile) device = 'Android Phone';
  else if (userAgent.includes('Android') && isTablet) device = 'Android Tablet';
  else if (isMobile) device = 'Mobile Device';
  else if (isTablet) device = 'Tablet';
  
  return {
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    isMobile,
    isTablet,
    isDesktop
  };
}

// 🔧 CONVERTIR VERSIONES DE WINDOWS
function getWindowsVersion(version: string): string {
  const versions: { [key: string]: string } = {
    '10.0': 'Windows 10/11',
    '6.3': 'Windows 8.1',
    '6.2': 'Windows 8',
    '6.1': 'Windows 7',
    '6.0': 'Windows Vista'
  };
  return versions[version] || `Windows ${version}`;
}

// 🔧 GENERAR SESSION ID ÚNICO
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `sess_${timestamp}_${random}`;
}
