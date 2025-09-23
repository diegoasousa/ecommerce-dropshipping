console.log('🧪 Testando webhook do Mercado Pago com curl...');

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testWebhook() {
  // 1. Verificar pedidos existentes
  console.log('\n📋 Verificando pedidos existentes...');
  try {
    const { stdout } = await execAsync('curl -s http://localhost:3001/orders');
    const orders = JSON.parse(stdout);
    console.log(`Encontrados ${orders.length} pedidos:`);
    orders.forEach(order => {
      console.log(`- Pedido ${order.id}: ${order.status} (Total: R$ ${order.total})`);
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error.message);
    return;
  }
  
  // 2. Testar webhook
  console.log('\n🔔 Testando webhook...');
  try {
    const { stdout } = await execAsync(`curl -s -X POST http://localhost:3001/mercadopago/webhook -H "Content-Type: application/json" -d '{"type": "payment", "data": {"id": "fake123"}}'`);
    console.log('Resposta do webhook:', stdout);
  } catch (error) {
    console.error('Erro no webhook:', error.message);
  }
  
  // 3. Verificar pedidos após webhook
  console.log('\n📋 Verificando pedidos após webhook...');
  try {
    const { stdout } = await execAsync('curl -s http://localhost:3001/orders');
    const orders = JSON.parse(stdout);
    orders.forEach(order => {
      console.log(`- Pedido ${order.id}: ${order.status} (Total: R$ ${order.total})`);
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error.message);
  }
}

testWebhook().catch(console.error);