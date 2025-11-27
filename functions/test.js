// Cloudflare Pages Function - DEBUG
export async function onRequest(context) {
  const { request } = context;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  // Endpoint de teste
  if (request.url.includes('/api/test')) {
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'API funcionando',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers
    });
  }

  // Teste de email - verifica se RESEND_API_KEY está configurada
  if (request.url.includes('/api/test-email')) {
    const env = context.env;
    const resendApiKey = env.RESEND_API_KEY;
    
    console.log('🧪 [TEST-EMAIL] Verificando RESEND_API_KEY...');
    console.log('🧪 [TEST-EMAIL] RESEND_API_KEY existe?', !!resendApiKey);
    if (resendApiKey) {
      console.log('🧪 [TEST-EMAIL] Primeiros 10 caracteres:', resendApiKey.substring(0, 10));
    }
    
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Teste de email',
      resendApiKeyExists: !!resendApiKey,
      resendApiKeyPreview: resendApiKey ? resendApiKey.substring(0, 10) + '***' : 'NOT SET',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers
    });
  }

  // Se não é /api/test, passa para next
  return context.next();
}

