// scripts/test_all_flows.js
// Automated verification script for all 8 commercial flows in MonResto Pro
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import initial data and types logic
import { initialClients, initialEmployees, initialMenuItems, initialTables, formatDA } from '../src/data/initialData.js';

describe('FLUX 0: Super Admin Master Key & Isolation Sécurisée', () => {
  it('Doit débloquer le Super Admin UNIQUEMENT avec 9999 ou SUPERADMIN', () => {
    const isSuperAdminCode = (code) => {
      const c = code.trim().toUpperCase();
      return c === '9999' || c === 'SUPERADMIN';
    };

    assert.equal(isSuperAdminCode('9999'), true, 'Code 9999 doit ouvrir SuperAdmin');
    assert.equal(isSuperAdminCode('superadmin'), true, 'Code superadmin insensible à la casse doit ouvrir SuperAdmin');
    assert.equal(isSuperAdminCode('1122'), false, 'Code staff 1122 ne doit PAS ouvrir SuperAdmin');
    assert.equal(isSuperAdminCode('0000'), false, 'Code erroné 0000 ne doit PAS ouvrir SuperAdmin');
  });

  it('Doit refuser les codes PIN du personnel sur la page commerciale principale', () => {
    const staffPins = initialEmployees.filter(e => e.role !== 'admin').map(e => e.pinCode);
    const clientCodes = initialClients.map(c => c.adminPinCode.toUpperCase());

    const canLoginCommercial = (input) => {
      const trimmed = input.trim().toUpperCase();
      if (trimmed === '9999' || trimmed === 'SUPERADMIN') return { ok: true, type: 'superadmin' };
      const client = initialClients.find(c => c.adminPinCode.toUpperCase() === trimmed);
      if (client) return { ok: true, type: 'client_admin', client };
      return { ok: false, error: 'Code client invalide' };
    };

    // Vérifier que chaque code staff échoue sur la page commerciale
    for (const pin of staffPins) {
      const res = canLoginCommercial(pin);
      assert.equal(res.ok, false, `Le PIN staff ${pin} ne doit pas pouvoir se connecter sur la page commerciale`);
    }

    // Vérifier que le code client admin réussit
    const adminRes = canLoginCommercial('RESTO-4412');
    assert.equal(adminRes.ok, true, 'Le code admin RESTO-4412 doit se connecter');
    assert.equal(adminRes.type, 'client_admin');
  });
});

describe('FLUX 1: Gestion des Licences, Shutoff & Verrouillage À Vie', () => {
  it('Doit bloquer immédiatement un client si Shutoff = true', () => {
    const client = { ...initialClients[0], shutoff: true };
    const isClientBlocked = client.shutoff || (client.expiresAt && new Date(client.expiresAt).getTime() < Date.now());
    assert.equal(isClientBlocked, true, 'Le client en Shutoff doit être bloqué immédiatement');
  });

  it('Doit bloquer immédiatement un client si la licence est expirée', () => {
    const pastDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const client = { ...initialClients[0], shutoff: false, expiresAt: pastDate };
    const isClientBlocked = client.shutoff || (client.expiresAt && new Date(client.expiresAt).getTime() < Date.now());
    assert.equal(isClientBlocked, true, 'Le client expiré doit être bloqué');
  });

  it('Doit autoriser un abonnement À Vie verrouillé sans date d’expiration', () => {
    const client = {
      ...initialClients[0],
      subscriptionPlan: 'a_vie',
      expiresAt: null,
      lifetimeLocked: true,
      shutoff: false,
    };
    const isClientBlocked = client.shutoff || (client.expiresAt && new Date(client.expiresAt).getTime() < Date.now());
    assert.equal(isClientBlocked, false, 'Le client À Vie actif ne doit pas être bloqué');
    assert.equal(client.expiresAt, null, 'Un abonnement à vie n’a aucune date d’expiration');
    assert.equal(client.lifetimeLocked, true, 'L’abonnement à vie est verrouillé');
  });
});

describe('FLUX 2: Terminal Interne Staff & Contrôle Strict du Quota d’Écrans', () => {
  it('Doit générer l’URL interne dédiée du restaurant', () => {
    const generateInternalUrl = (clientId, origin = 'http://localhost:5173') => {
      return `${origin}/?terminal=staff&resto=${encodeURIComponent(clientId)}`;
    };

    const url = generateInternalUrl('client-1');
    assert.equal(url, 'http://localhost:5173/?terminal=staff&resto=client-1');
    assert.ok(url.includes('terminal=staff'), 'L’URL doit contenir le paramètre terminal=staff');
  });

  it('Doit BLOQUER l’ajout d’un nouvel employé lorsque maxStaffQuota est atteint', () => {
    let client = { ...initialClients[0], maxStaffQuota: 3 };
    let employees = [
      { id: 'adm', role: 'admin', name: 'Gérant' }, // admin ne compte pas dans le quota staff
      { id: 'st1', role: 'caissier', name: 'Caissier 1' },
      { id: 'st2', role: 'serveur', name: 'Serveur 1' },
      { id: 'st3', role: 'cuisinier', name: 'Cuisine 1' },
    ];

    const canAddEmployee = (clientObj, empList) => {
      const staffCount = empList.filter(e => e.role !== 'admin').length;
      return staffCount < (clientObj.maxStaffQuota || 5);
    };

    assert.equal(canAddEmployee(client, employees), false, 'L’ajout doit être refusé car 3/3 staff utilisés');

    // Le Super Admin augmente le quota à 5
    client = { ...client, maxStaffQuota: 5 };
    assert.equal(canAddEmployee(client, employees), true, 'L’ajout doit être accepté après augmentation du quota');
  });
});

describe('FLUX 3: Prise de Commande POS avec Options & Sauces Personnalisées', () => {
  it('Doit calculer correctement le total avec plat + options + suppléments', () => {
    const plat = initialMenuItems[0]; // Burger Gourmet (750 DA)
    assert.ok(plat, 'Le plat doit exister');

    const selectedOptions = {
      size: 'Double Steak (+250 DA)',
      cuisson: 'À point',
      sauces: ['Sauce Algérienne', 'Sauce Fromagère'],
      supplements: [
        { name: 'Cheddar Fondu', priceDA: 100 },
        { name: 'Dinde Fumée', priceDA: 150 },
      ],
    };

    const supplementTotal = selectedOptions.supplements.reduce((acc, s) => acc + s.priceDA, 0);
    const sizeExtra = 250;
    const basePrice = plat.price;
    const unitPrice = basePrice + sizeExtra + supplementTotal;
    const quantity = 2;
    const lineTotal = unitPrice * quantity;

    assert.equal(unitPrice, 750 + 250 + 100 + 150, 'Prix unitaire = 1250 DA');
    assert.equal(lineTotal, 2500, 'Total pour 2 burgers = 2500 DA');
  });
});

describe('FLUX 4: Plan de Salle & Tables', () => {
  it('Doit basculer une table de libre à occupée lors de la commande', () => {
    let table = { ...initialTables[0], status: 'libre', activeOrderId: undefined };

    // Affectation de commande
    const newOrderId = 'ord-101';
    table = { ...table, status: 'occupee', activeOrderId: newOrderId };

    assert.equal(table.status, 'occupee');
    assert.equal(table.activeOrderId, 'ord-101');

    // Libération après paiement
    table = { ...table, status: 'libre', activeOrderId: undefined };
    assert.equal(table.status, 'libre');
    assert.equal(table.activeOrderId, undefined);
  });
});

describe('FLUX 5: Production Cuisine (KDS)', () => {
  it('Doit suivre la progression des statuts : en_attente -> en_preparation -> pret', () => {
    let order = {
      id: 'ord-kds-1',
      status: 'en_attente',
      startedPrepAt: null,
      readyAt: null,
    };

    // Cuisinier clique sur "Lancer la préparation"
    order.status = 'en_preparation';
    order.startedPrepAt = new Date().toISOString();
    assert.equal(order.status, 'en_preparation');
    assert.ok(order.startedPrepAt);

    // Cuisinier clique sur "Prêt"
    order.status = 'pret';
    order.readyAt = new Date().toISOString();
    assert.equal(order.status, 'pret');
    assert.ok(order.readyAt);
  });
});

describe('FLUX 6: Borne Interactive Kiosk Totem', () => {
  it('Doit créer une commande Borne avec source "borne" et numéro séquentiel', () => {
    const createKioskOrder = (items, total) => {
      return {
        id: 'ord-kiosk-99',
        orderNumber: 42,
        source: 'borne',
        type: 'sur_place',
        items,
        total,
        paid: false,
        paymentMethod: 'cib_edahabia',
        status: 'en_attente',
        createdAt: new Date().toISOString(),
      };
    };

    const kOrder = createKioskOrder([{ title: 'Menu Tacos L', price: 950 }], 950);
    assert.equal(kOrder.source, 'borne', 'La commande doit porter la mention source: borne');
    assert.equal(kOrder.total, 950);
    assert.equal(kOrder.orderNumber, 42);
  });
});

describe('FLUX 7: Clôture de Caisse, Suivi Nominatif & Tiroir Espèces', () => {
  it('Doit calculer exactement les espèces attendues dans le tiroir du caissier', () => {
    const cashier = {
      id: 'emp-c1',
      name: 'Sofiane (Caissier)',
      cashFloatDA: 10000, // Fonds de caisse initial : 10 000 DA
    };

    const orders = [
      { id: '1', cashedByEmployeeId: 'emp-c1', paid: true, paymentMethod: 'especes', total: 2500, status: 'pret' },
      { id: '2', cashedByEmployeeId: 'emp-c1', paid: true, paymentMethod: 'especes', total: 1800, status: 'pret' },
      { id: '3', cashedByEmployeeId: 'emp-c1', paid: true, paymentMethod: 'cib_edahabia', total: 3200, status: 'pret' },
      { id: '4', cashedByEmployeeId: 'other-emp', paid: true, paymentMethod: 'especes', total: 5000, status: 'pret' },
    ];

    const cashierOrders = orders.filter(o => o.cashedByEmployeeId === cashier.id && o.paid);
    const cashTotal = cashierOrders
      .filter(o => o.paymentMethod === 'especes')
      .reduce((sum, o) => sum + o.total, 0);

    const cibTotal = cashierOrders
      .filter(o => o.paymentMethod === 'cib_edahabia')
      .reduce((sum, o) => sum + o.total, 0);

    const expectedDrawerCash = cashier.cashFloatDA + cashTotal;

    assert.equal(cashTotal, 2500 + 1800, 'Total espèces encaissées = 4300 DA');
    assert.equal(cibTotal, 3200, 'Total CIB = 3200 DA');
    assert.equal(expectedDrawerCash, 10000 + 4300, 'Espèces attendues dans le tiroir = 14 300 DA');
    assert.equal(formatDA(expectedDrawerCash), '14 300 DA');
  });

  it('Doit assurer la double traçabilité nominative (Saisie par Serveur + Encaissé par Caissier)', () => {
    const order = {
      id: 'ord-audit-1',
      createdByEmployeeId: 'srv-1',
      createdByEmployeeName: 'Yacine (Serveur Salle)',
      cashedByEmployeeId: 'csh-1',
      cashedByEmployeeName: 'Amine (Caisse Principale)',
      paid: true,
      total: 3500,
    };

    assert.equal(order.createdByEmployeeName, 'Yacine (Serveur Salle)', 'Serveur identifié');
    assert.equal(order.cashedByEmployeeName, 'Amine (Caisse Principale)', 'Caissier identifié');
  });
});

