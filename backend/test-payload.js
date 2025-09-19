// Script para testar o payload que você está enviando
const testPayload = [
  {
    "productId": "3",
    "name": "Vestido Florido Infantil", // Este campo será ignorado (busca do banco)
    "quantity": 1,
    "price": 3000 // Este campo será ignorado (busca do banco)
  }
];

console.log('Payload de teste:', JSON.stringify(testPayload, null, 2));

// Simulação da lógica do controller
function processPayload(body) {
  let items;
  
  if (Array.isArray(body)) {
    // Formato array direto
    items = body;
    console.log('✅ Formato array direto detectado');
  } else if (body && Array.isArray(body.items)) {
    // Formato com wrapper
    items = body.items;
    console.log('✅ Formato wrapper detectado');
  } else {
    console.log('❌ Formato inválido');
    return;
  }

  items.forEach((item, idx) => {
    const productId = Number(item.productId);
    const quantity = Math.max(1, Number(item.quantity) || 1);
    
    console.log(`Item ${idx + 1}:`);
    console.log(`  - productId: "${item.productId}" -> ${productId}`);
    console.log(`  - quantity: ${item.quantity} -> ${quantity}`);
    console.log(`  - name: "${item.name}" (será ignorado)`);
    console.log(`  - price: ${item.price} (será ignorado)`);
  });
}

console.log('\n--- Testando processamento ---');
processPayload(testPayload);