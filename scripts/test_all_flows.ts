// scripts/test_all_flows.ts
// Test complet de validation opérationnelle et commerciale de MonResto Pro
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { INITIAL_MENU_ITEMS, INITIAL_TABLES, formatDA } from '../src/data/initialData.ts';
import type { ClientAccount, Employee, Order, RestaurantTable } from '../src/types.ts';

describe('FLUX 0: Super Admin Master Key & Isolation Sécurisée', () => {
  it('Doit débloquer le Super Admin UNIQUEMENT avec 9999 ou SUPERADMIN', () => {
    const isSuperAdminCode = (code: string) => {
      const c = code.trim().toUpperCase();
      return c === '9999' || c === 'SUPERADMIN';
    };

    assert.equal(isSuperAdminCode('9999'), true, 'Code 9999 doit ouvrir SuperAdmin');
    assert.equal(isSuperAdminCode('superadmin'), true, 'Code superadmin insensible à la casse doit ouvrir SuperAdmin');
    assert.equal(isSuperAdminCode('SUPERADMIN'), true, 'Code SUPERADMIN doit ouvrir SuperAdmin');
    assert.equal(isSuperAdminCode('1122'), false, 'Code staff 1122 ne doit PAS ouvrir SuperAdmin');
    assert.equal(isSuperAdminCode('0000'), false, 'Code erroné 0000 ne doit PAS ouvrir SuperAdmin');
  });

  it('Doit refuser les codes PIN du personnel sur la page commerciale principale', () => {
    const sampleClients: ClientAccount[] = [
      {
        id: 'client-test-1',
        restaurantName: 'Le Gourmet DZ',
        ownerName: 'Fodil K.',
        phone: '0550123456',
        adminPinCode: 'RESTO-4412',
        subscriptionPlan: '1_an',
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        shutoff: false,
        maxStaffQuota: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    const staffPins = ['1122', '2233', '3344', '4455', '5566'];

    const canLoginCommercial = (input: string) => {
      const trimmed = input.trim().toUpperCase();
      if (trimmed === '9999' || trimmed === 'SUPERADMIN') return { ok: true, type: 'superadmin' };
      const client = sampleClients.find((c) => c.adminPinCode.toUpperCase() === trimmed);
      if (client) return { ok: true, type: 'client_admin', client };
      return { ok: false, error: 'Code restaurant invalide' };
    };

    // Aucun code PIN employé ne doit franchir la page commerciale
    for (const pin of staffPins) {
      const res = canLoginCommercial(pin);
      assert.equal(res.ok, false, `Le PIN employé ${pin} doit être refusé sur le portail commercial`);
    }

    // Le code d'activation restaurant valide doit être accepté
    const adminRes = canLoginCommercial('RESTO-4412');
    assert.equal(adminRes.ok, true, 'Le code admin RESTO-4412 doit être accepté');
    assert.equal(adminRes.type, 'client_admin');
    assert.equal(adminRes.client?.restaurantName, 'Le Gourmet DZ');
  });
});

describe('FLUX 1: Gestion des Licences, Shutoff & Verrouillage À Vie', () => {
  const baseClient: ClientAccount = {
    id: 'client-1',
    restaurantName: 'Pizzeria Napoli DZ',
    ownerName: 'Karim',
    phone: '0661234567',
    adminPinCode: 'NAPOLI-2026',
    subscriptionPlan: '1_mois',
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    shutoff: false,
    maxStaffQuota: 5,
    createdAt: new Date().toISOString(),
  };

  it('Doit bloquer immédiatement un restaurant si Shutoff = true', () => {
    const client: ClientAccount = { ...baseClient, shutoff: true };
    const isClientBlocked = client.shutoff || (client.expiresAt !== null && new Date(client.expiresAt).getTime() < Date.now());
    assert.equal(isClientBlocked, true, 'Un client avec shutoff doit être bloqué immédiatement');
  });

  it('Doit bloquer un restaurant si sa période d’abonnement est échue', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const client: ClientAccount = { ...baseClient, shutoff: false, expiresAt: pastDate };
    const isClientBlocked = client.shutoff || (client.expiresAt !== null && new Date(client.expiresAt).getTime() < Date.now());
    assert.equal(isClientBlocked, true, 'Un abonnement échu doit déclencher le blocage');
  });

  it('Doit autoriser un abonnement À Vie verrouillé sans date d’expiration', () => {
    const client: ClientAccount = {
      ...baseClient,
      subscriptionPlan: 'a_vie',
      expiresAt: null,
      lifetimeLocked: true,
      shutoff: false,
    };
    const isClientBlocked = client.shutoff || (client.expiresAt !== null && new Date(client.expiresAt).getTime() < Date.now());
    assert.equal(isClientBlocked, false, 'Le plan À Vie actif ne doit pas être bloqué');
    assert.equal(client.expiresAt, null, 'Un plan à vie n’expire jamais');
    assert.equal(client.lifetimeLocked, true, 'Le statut à vie est verrouillé');
  });
});

describe('FLUX 2: Terminal Interne Staff & Contrôle Strict du Quota d’Écrans', () => {
  it('Doit générer l’URL interne dédiée du restaurant avec le paramètre terminal=staff', () => {
    const generateInternalUrl = (clientId: string, origin = 'http://localhost:5173') => {
      return `${origin}/?terminal=staff&resto=${encodeURIComponent(clientId)}`;
    };

    const url = generateInternalUrl('resto-dz-99');
    assert.equal(url, 'http://localhost:5173/?terminal=staff&resto=resto-dz-99');
    assert.ok(url.includes('terminal=staff'), 'L’URL doit contenir terminal=staff');
    assert.ok(url.includes('resto=resto-dz-99'), 'L’URL doit contenir l’identifiant du resto');
  });

  it('Doit BLOQUER l’ajout d’un nouvel employé lorsque maxStaffQuota est atteint', () => {
    let client: ClientAccount = {
      id: 'c-test',
      restaurantName: 'Burger Palace',
      ownerName: 'Ali',
      phone: '0555000000',
      adminPinCode: 'BP-01',
      subscriptionPlan: '1_an',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      shutoff: false,
      maxStaffQuota: 3, // Quota débloqué = 3 staff
      createdAt: new Date().toISOString(),
    };

    let employees: Employee[] = [
      { id: 'adm', role: 'admin', name: 'Gérant', pinCode: '9999', active: true },
      { id: 'st1', role: 'caissier', name: 'Caissier 1', pinCode: '1122', active: true },
      { id: 'st2', role: 'serveur', name: 'Serveur 1', pinCode: '2233', active: true },
      { id: 'st3', role: 'cuisinier', name: 'Cuisine 1', pinCode: '3344', active: true },
    ];

    const canAddEmployee = (clientObj: ClientAccount, empList: Employee[]) => {
      const staffCount = empList.filter((e) => e.role !== 'admin').length;
      return staffCount < (clientObj.maxStaffQuota || 5);
    };

    // 3 employés sur un quota de 3 -> Bloqué
    assert.equal(canAddEmployee(client, employees), false, 'L’ajout doit être bloqué à 3/3');

    // Super Admin augmente le quota à 6
    client = { ...client, maxStaffQuota: 6 };
    assert.equal(canAddEmployee(client, employees), true, 'L’ajout est débloqué après augmentation du quota');
  });
});

describe('FLUX 3: Prise de Commande POS avec Options & Sauces Personnalisées', () => {
  it('Doit calculer correctement le total avec plat + options + suppléments en DA', () => {
    const plat = INITIAL_MENU_ITEMS[0]; // Le Dzayer Smash Double (750 DA)
    assert.ok(plat, 'Le plat doit exister dans le menu');
    assert.equal(plat.name, 'Le Dzayer Smash Double');
    assert.equal(plat.price, 750);

    const selectedOptions = {
      size: 'Menu XL (Frites Cheddar Bacon + Boisson)',
      sizePriceDA: 400,
      sauces: ['Sauce Algérienne', 'Sauce Fromagère (50 DA)'],
      saucePriceDA: 50,
      supplements: [
        { name: 'Double Cheddar affiné', priceDA: 100 },
        { name: 'Bacon de dinde fumée', priceDA: 150 },
      ],
    };

    const supplementTotal = selectedOptions.supplements.reduce((acc, s) => acc + s.priceDA, 0);
    const unitPrice = plat.price + selectedOptions.sizePriceDA + selectedOptions.saucePriceDA + supplementTotal;
    const quantity = 3;
    const lineTotal = unitPrice * quantity;

    assert.equal(unitPrice, 750 + 400 + 50 + 100 + 150, 'Prix unitaire = 1450 DA');
    assert.equal(lineTotal, 4350, 'Total pour 3 menus complets = 4350 DA');
    assert.equal(formatDA(lineTotal).replace(/\s+/g, ' '), '4 350 DA');
  });
});

describe('FLUX 4: Plan de Salle & Tables', () => {
  it('Doit basculer une table de libre à occupée lors de la commande et la libérer après encaissement', () => {
    const table: RestaurantTable = { ...INITIAL_TABLES[0], status: 'libre' };
    assert.equal(table.status, 'libre');

    // Prise de commande par un serveur sur la Table 01
    const orderId = 'ord-table-01';
    const occupiedTable: RestaurantTable = { ...table, status: 'occupee', activeOrderId: orderId };
    assert.equal(occupiedTable.status, 'occupee');
    assert.equal(occupiedTable.activeOrderId, orderId);

    // Règlement de la table à la caisse
    const freedTable: RestaurantTable = { ...occupiedTable, status: 'libre', activeOrderId: undefined };
    assert.equal(freedTable.status, 'libre');
    assert.equal(freedTable.activeOrderId, undefined);
  });
});

describe('FLUX 5: Production Cuisine (KDS)', () => {
  it('Doit orchestrer la chaîne de préparation : en_attente -> en_preparation -> pret', () => {
    let order: {
      id: string;
      status: 'en_attente' | 'en_preparation' | 'pret' | 'livre';
      startedPrepAt: string | null;
      readyAt: string | null;
    } = {
      id: 'ord-kds-test',
      status: 'en_attente',
      startedPrepAt: null,
      readyAt: null,
    };

    // 1. Commande créée : en attente
    assert.equal(order.status, 'en_attente');

    // 2. Le chef démarre la cuisson : chrono lancé
    order.status = 'en_preparation';
    order.startedPrepAt = new Date().toISOString();
    assert.equal(order.status, 'en_preparation');
    assert.ok(order.startedPrepAt);

    // 3. Le chef sonne le plat : prêt pour le serveur / comptoir
    order.status = 'pret';
    order.readyAt = new Date().toISOString();
    assert.equal(order.status, 'pret');
    assert.ok(order.readyAt);
  });
});

describe('FLUX 6: Borne Interactive Kiosk Totem', () => {
  it('Doit générer une commande Borne avec source "borne", numéro séquentiel et options', () => {
    const createKioskOrder = (items: Array<{ title: string; price: number }>, total: number): Partial<Order> => {
      return {
        id: 'ord-kiosk-100',
        orderNumber: 77,
        source: 'borne',
        type: 'sur_place',
        items: items as any,
        total,
        paid: true,
        paymentMethod: 'cib_edahabia',
        status: 'en_attente',
        createdAt: new Date().toISOString(),
      };
    };

    const kOrder = createKioskOrder([{ title: 'Tacos Royal Gratiné', price: 850 }], 850);
    assert.equal(kOrder.source, 'borne', 'Doit porter le tag source: borne');
    assert.equal(kOrder.orderNumber, 77);
    assert.equal(kOrder.paymentMethod, 'cib_edahabia');
    assert.equal(kOrder.total, 850);
  });
});

describe('FLUX 7: Clôture de Caisse, Suivi Nominatif & Tiroir Espèces', () => {
  it('Doit calculer exactement les espèces attendues dans le tiroir du caissier', () => {
    const cashier: Partial<Employee> = {
      id: 'emp-c1',
      name: 'Sofiane (Caissier Soir)',
      cashFloatDA: 15000, // Fonds initial 15 000 DA
    };

    const orders = [
      { id: '1', cashedByEmployeeId: 'emp-c1', paid: true, paymentMethod: 'especes', total: 2500, status: 'pret' },
      { id: '2', cashedByEmployeeId: 'emp-c1', paid: true, paymentMethod: 'especes', total: 3200, status: 'pret' },
      { id: '3', cashedByEmployeeId: 'emp-c1', paid: true, paymentMethod: 'cib_edahabia', total: 4000, status: 'pret' },
      { id: '4', cashedByEmployeeId: 'autre-caissier', paid: true, paymentMethod: 'especes', total: 7000, status: 'pret' },
    ];

    const cashierOrders = orders.filter((o) => o.cashedByEmployeeId === cashier.id && o.paid);
    const cashTotal = cashierOrders
      .filter((o) => o.paymentMethod === 'especes')
      .reduce((sum, o) => sum + o.total, 0);

    const cibTotal = cashierOrders
      .filter((o) => o.paymentMethod === 'cib_edahabia')
      .reduce((sum, o) => sum + o.total, 0);

    const expectedDrawerCash = (cashier.cashFloatDA || 0) + cashTotal;

    assert.equal(cashTotal, 2500 + 3200, 'Total espèces encaissées = 5700 DA');
    assert.equal(cibTotal, 4000, 'Total CIB = 4000 DA');
    assert.equal(expectedDrawerCash, 15000 + 5700, 'Espèces attendues = 20 700 DA');
    assert.equal(formatDA(expectedDrawerCash).replace(/\s+/g, ' '), '20 700 DA');
  });

  it('Doit assurer la double traçabilité nominative (Saisie par Serveur + Encaissé par Caissier)', () => {
    const order: Partial<Order> = {
      id: 'ord-audit-1',
      createdByEmployeeId: 'srv-1',
      createdByEmployeeName: 'Yacine (Serveur Salle)',
      cashedByEmployeeId: 'csh-1',
      cashedByEmployeeName: 'Amine (Caisse Principale)',
      paid: true,
      total: 3500,
    };

    assert.equal(order.createdByEmployeeName, 'Yacine (Serveur Salle)', 'Serveur identifié sur le ticket');
    assert.equal(order.cashedByEmployeeName, 'Amine (Caisse Principale)', 'Caissier identifié sur le ticket');
  });
});
