# 🔥 Configuração de Firewall no Oracle Cloud - Guia Passo a Passo

## 📍 Localização: Security Lists (Listas de Segurança)

### 🎯 **Parte 1: Acessar as Configurações de Rede**

1. **Faça login no Oracle Cloud Console:**
   - Acesse: https://cloud.oracle.com
   - Faça login com sua conta

2. **Navegue até Networking:**
   ```
   Menu Hambúrguer (☰) → Networking → Virtual Cloud Networks
   ```

3. **Selecione sua VCN:**
   - Clique na VCN onde sua VM está (geralmente `vcn-xxxxx` ou `Default VCN`)

### 🛡️ **Parte 2: Configurar Security Lists**

4. **Acesse Security Lists:**
   ```
   Na página da VCN → Resources (menu lateral) → Security Lists
   ```

5. **Edite a Default Security List:**
   - Clique em `Default Security List for vcn-xxxxx`
   - Você verá as regras existentes

### ➕ **Parte 3: Adicionar Regras de Ingress (Entrada)**

6. **Clique em "Add Ingress Rules"**

7. **Adicione as 3 regras necessárias:**

#### **Regra 1: HTTP (Porta 80)**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Source Port Range: (deixe em branco)
Destination Port Range: 80
Description: HTTP Traffic
```

#### **Regra 2: HTTPS (Porta 443)**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Source Port Range: (deixe em branco)
Destination Port Range: 443
Description: HTTPS Traffic
```

#### **Regra 3: Backend API (Porta 3001)**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Source Port Range: (deixe em branco)
Destination Port Range: 3001
Description: Backend API
```

8. **Clique "Add Ingress Rules"** para cada regra

## 🖼️ **Guia Visual das Telas:**

### Tela 1: Menu Principal
```
┌─────────────────────────────────────┐
│ ☰ [Menu]                           │
│                                     │
│ 🏠 Home                            │
│ 💻 Compute                         │
│ 🌐 Networking          ← CLIQUE    │
│   └─ Virtual Cloud Networks        │
│ 💾 Storage                         │
│ 🗄️ Database                        │
└─────────────────────────────────────┘
```

### Tela 2: Virtual Cloud Networks
```
┌─────────────────────────────────────┐
│ Virtual Cloud Networks              │
│                                     │
│ 📋 Name          Status    Region   │
│ vcn-20231122     Active    Brazil   │ ← CLIQUE
│                                     │
└─────────────────────────────────────┘
```

### Tela 3: Detalhes da VCN
```
┌─────────────────────────────────────┐
│ vcn-20231122                        │
│                                     │
│ Resources:              │ General   │
│ • Subnets              │ Info      │
│ • Route Tables         │           │
│ • Security Lists       │ ← CLIQUE  │
│ • DHCP Options         │           │
│ • Internet Gateways    │           │
└─────────────────────────────────────┘
```

### Tela 4: Security Lists
```
┌─────────────────────────────────────┐
│ Security Lists                      │
│                                     │
│ 📋 Name                            │
│ Default Security List for vcn-xxx  │ ← CLIQUE
│                                     │
└─────────────────────────────────────┘
```

### Tela 5: Ingress Rules
```
┌─────────────────────────────────────┐
│ Default Security List               │
│                                     │
│ Ingress Rules              Egress  │
│                                     │
│ [+ Add Ingress Rules]     ← CLIQUE  │
│                                     │
│ Source      Protocol  Port  Desc   │
│ 0.0.0.0/0   TCP       22    SSH    │
│                                     │
└─────────────────────────────────────┘
```

### Tela 6: Formulário de Nova Regra
```
┌─────────────────────────────────────┐
│ Add Ingress Rules                   │
│                                     │
│ Source Type: CIDR          ▼       │
│ Source CIDR: 0.0.0.0/0             │
│ IP Protocol: TCP           ▼       │
│ Source Port Range: [blank]         │
│ Destination Port Range: 80         │ ← CONFIGURE
│ Description: HTTP Traffic          │
│                                     │
│ [Add Ingress Rules]       [Cancel] │
└─────────────────────────────────────┘
```

## ✅ **Resultado Final - Suas Regras Devem Ficar Assim:**

```
┌─────────────────────────────────────────────────────────┐
│ Ingress Rules                                           │
│                                                         │
│ Source      Protocol  Port  Description                │
│ 0.0.0.0/0   TCP       22    SSH                        │ ← Já existe
│ 0.0.0.0/0   TCP       80    HTTP Traffic               │ ← Nova
│ 0.0.0.0/0   TCP       443   HTTPS Traffic              │ ← Nova  
│ 0.0.0.0/0   TCP       3001  Backend API                │ ← Nova
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🧪 **Teste se Funcionou:**

### Via Terminal (do seu computador):
```bash
# Substitua IP_DA_SUA_VM pelo IP público da sua instância
IP_DA_SUA_VM="xxx.xxx.xxx.xxx"

# Teste porta 80
nc -zv $IP_DA_SUA_VM 80

# Teste porta 443  
nc -zv $IP_DA_SUA_VM 443

# Teste porta 3001
nc -zv $IP_DA_SUA_VM 3001
```

### Via Browser:
- Acesse: `http://SEU_IP_PUBLICO` (deve dar erro 502/503, mas conectar)
- Acesse: `http://SEU_IP_PUBLICO:3001` (deve dar erro de conexão ou resposta da API)

## ⚠️ **Problemas Comuns:**

### **1. "Não vejo o menu Networking"**
- Certifique-se de estar na região correta (top-right da tela)
- Alguns painéis podem estar em inglês

### **2. "Não acho a VCN"** 
- Verifique se está no compartment correto (menu dropdown no topo)
- Pode estar em "root" ou outro compartment

### **3. "As regras não funcionam"**
- Aguarde 2-3 minutos para aplicar
- Verifique se o CIDR é `0.0.0.0/0` (não `0.0.0.0/32`)
- Verifique se o protocolo é `TCP`

### **4. "Ainda não conecta"**
- Verifique se sua VM está rodando
- Teste SSH primeiro: `ssh ubuntu@SEU_IP`
- Verifique se o serviço está rodando na VM

## 🔄 **Comandos para Testar na VM (após conectar via SSH):**

```bash
# Verificar se as portas estão escutando
sudo netstat -tlnp | grep -E ':(80|443|3001)'

# Verificar firewall local da VM
sudo ufw status

# Se ufw estiver ativo, liberar portas:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  
sudo ufw allow 3001/tcp
```

## 📞 **Se Ainda Não Funcionar:**

1. **Verifique no Oracle Cloud Console:**
   - Compute → Instances → Sua VM → Attached VNICs
   - Anote o Subnet e VCN
   - Volte e configure o Security List correto

2. **Teste conexão básica:**
   ```bash
   ping SEU_IP_PUBLICO
   ssh ubuntu@SEU_IP_PUBLICO
   ```

3. **Verifique logs da aplicação:**
   ```bash
   # Na VM
   docker-compose logs
   ```

Isso deve resolver! As portas 80, 443 e 3001 ficarão abertas para receber tráfego do Mercado Pago e usuários.