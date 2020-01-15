// eslint-disable-next-line jsx-a11y/label-has-associated-control
import CQLParser, { CQLBoolean } from './cql';

// typical mirage config export
// http://www.ember-cli-mirage.com/docs/v0.4.x/configuration/
export default function config() {
  // okapi endpoints
  this.get('/_/version', () => '0.0.0');

  this.get('_/proxy/tenants/:id/modules', []);

  this.get('/saml/check', {
    ssoEnabled: false
  });

  this.get('/configurations/entries', {
    configs: []
  });
  this.post('/bl-users/login', () => {
    return new Response(201, {
      'X-Okapi-Token': `myOkapiToken:${Date.now()}`
    }, {
      user: {
        id: 'test',
        username: 'testuser',
        personal: {
          lastName: 'User',
          firstName: 'Test',
          email: 'user@folio.org',
        }
      },
      permissions: {
        permissions: []
      }
    });
  });
  this.get('/groups', {
    'usergroups': [{
      'group': 'alumni_1383',
      'desc': 'Alumni',
      'id': 'group1',
    }, {
      'group': 'alumni_2121',
      'desc': 'Alumni',
      'id': 'group2',
    }, {
      'group': 'alumni_6422',
      'desc': 'Alumni',
      'id': 'group3',
    }, {
      'group': 'faculty',
      'desc': 'Faculty Member',
      'id': 'group4',
    }, {
      'group': 'graduate',
      'desc': 'Graduate Student',
      'id': 'group5',
    }, {
      'group': 'staff',
      'desc': 'Staff Member',
      'id': 'group6',
    }, {
      'group': 'undergrad',
      'desc': 'Undergraduate Student',
      'id': 'group7',
    }],
    'totalRecords': 7
  });
  this.get('/addresstypes', {
    'addressTypes': [{
      'addressType': 'Claim',
      'desc': 'Claim Address',
      'id': 'Type1',
    }, {
      'addressType': 'Home',
      'desc': 'Home Address',
      'id': 'Type2',
    }, {
      'addressType': 'Order',
      'desc': 'Order Address',
      'id': 'Type3',
    }, {
      'addressType': 'Payment',
      'desc': 'Payment Address',
      'id': 'Type4',
    }, {
      'addressType': 'Returns',
      'desc': 'Returns Address',
      'id': 'Type5',
    }, {
      'addressType': 'Work',
      'desc': 'Work Address',
      'id': 'Type6',
    }],
    'totalRecords': 6
  });

  this.get('/users', ({ users }, request) => {
    if (request.queryParams.query) {
      const cqlParser = new CQLParser();
      cqlParser.parse(request.queryParams.query);
      const { field, term } = cqlParser.tree;

      return users.where({ [field]: term });
    } else {
      return users.all();
    }
  });

  this.get('/users/:id', (schema, request) => {
    return schema.users.find(request.params.id).attrs;
  });
  this.get('/proxiesfor', {
    proxiesFor: [],
    totalRecords: 0,
  });
  this.get('/service-points-users', ({ servicePointsUsers }, request) => {
    const url = new URL(request.url);
    const cqlQuery = url.searchParams.get('query');
    const cqlParser = new CQLParser();
    cqlParser.parse(cqlQuery);
    return servicePointsUsers.where({
      userId: cqlParser.tree.term
    });
  });

  this.get('/service-points', ({ servicePoints }) => {
    return servicePoints.all();
  });

  this.get('/request-preference-storage/request-preference', ({ requestPreferences }, request) => {
    if (request.queryParams.query) {
      const cqlParser = new CQLParser();
      cqlParser.parse(request.queryParams.query);
      return requestPreferences.where({
        userId: cqlParser.tree.term
      });
    } else {
      return [];
    }
  });

  this.get('/circulation/loans', {
    loans: [],
    totalRecords: 0,
  });
  this.get('/requests', {
    requests: [],
    totalRecords: 0,
  });
  this.get('accounts', {
    accounts: [],
    totalRecords: 0,
    resultInfo: {
      totalRecords: 0,
      facets: [],
      diagnostics: [],
    },
  });
  this.get('waives', {
    waiver: [],
    totalRecords: 0,
    resultInfo: {
      totalRecords: 0,
      facets: [],
      diagnostics: [],
    },
  });
  this.get('payments', {
    payments: [],
    totalRecords: 0,
    resultInfo: {
      totalRecords: 0,
      facets: [],
      diagnostics: [],
    },
  });
  this.get('comments', {
    comments: [],
    totalRecords: 0,
    resultInfo: {
      totalRecords: 0,
      facets: [],
      diagnostics: [],
    },
  });
  this.get('feefines', {
    feefines: [],
    totalRecords: 0,
    resultInfo: {
      totalRecords: 0,
      facets: [],
      diagnostics: [],
    },
  });
  this.get('/manualblocks', {
    manualblocks: [],
    totalRecords: 0,
  });
  this.get('/perms/users/:id/permissions', {
    permissionNames: [],
  });
  this.get('/perms/permissions', {
    permissions: [],
    totalRecords: 0,
  });
  this.get('/feefineactions', {
    feefineactions: [],
    totalRecords: 0,
  });
  this.get('/owners', {
    owners: [],
    totalRecords: 0,
  });
  this.get('staff-slips-storage/staff-slips', {
    staffSlips: [{
      id: '8812bae1-2738-442c-bc20-fe4bb38a11f8',
      name: 'Pick slip',
      active: true,
      template: '<p><strong>{{item.title}}</strong></p>',
    }],
    totalRecords: 1
  });

  this.get('circulation/pick-slips/servicepointId1', {
    pickSlips: [{
      id : '7212ba6a-8dcf-45a1-be9a-ffaa847c4423',
      holdingsRecordId : 'e3ff6133-b9a2-4d4c-a1c9-dc1867d4df19',
      instanceId: '5bf370e0-8cca-4d9c-82e4-5170ab2a0a39',
      title: 'A semantic web primer',
      barcode: '10101',
      callNumber: 'TK5105.88815 . A58 2004 FT MEADE',
      status: { name: 'Paged' },
      contributors: [
        { name: 'Antoniou, Grigoris' },
        { name: 'Van Harmelen, Frank' }
      ],
      location: {
        name: 'Main Library',
        code: 'KU/CC/DI/M'
      }
    }],
    totalRecords: 1,
  });

  this.get('/cancellation-reason-storage/cancellation-reasons');

  this.get('/circulation/requests', ({ requests }) => {
    return requests.all();
  });

  this.get('/circulation/requests/:id', ({ requests }, request) => {
    return requests.find(request.params.id);
  });

  this.post('/circulation/requests', (_, request) => {
    const body = JSON.parse(request.requestBody);
    return this.create('request', body);
  });

  this.post('/circulation/requests/:id/move', (_, request) => {
    const body = JSON.parse(request.requestBody);

    return this.create('request', {
      id: body.id,
      itemId: body.destinationItemId
    });
  });

  this.put('/circulation/requests/:id', ({ requests }, request) => {
    const body = JSON.parse(request.requestBody);
    const reqModel = requests.find(body.id);
    const defaultReq = this.build('request');
    return reqModel.update({ ...defaultReq, ...body });
  });

  this.get('/request-storage/requests', ({ requests }, request) => {
    const url = new URL(request.url);
    const cqlQuery = url.searchParams.get('query');
    const cqlParser = new CQLParser();
    cqlParser.parse(cqlQuery);

    return requests.where({
      itemId: cqlParser.tree.term
    });
  });

  this.get('/request-storage/requests/:id', (schema, request) => {
    return schema.requests.find(request.params.id).attrs;
  });

  this.get('/inventory/items', ({ items }, request) => {
    if (request.queryParams.query) {
      const cqlParser = new CQLParser();
      cqlParser.parse(request.queryParams.query);
      const { field, term } = cqlParser.tree;
      return items.where({ [field]: term });
    } else {
      return items.all();
    }
  });

  this.post('/circulation/requests/queue/:itemId/reorder', []);

  this.get('/circulation/loans', ({ loans }, request) => {
    if (request.queryParams.query) {
      const cqlParser = new CQLParser();
      cqlParser.parse(request.queryParams.query);
      if (cqlParser.tree instanceof CQLBoolean) {
        return loans.where({
          itemId: cqlParser.tree.left.term
        });
      } else {
        return loans.where({
          itemId: cqlParser.tree.term
        });
      }
    } else {
      return loans.all();
    }
  });

  this.get('/holdings-storage/holdings', ({ holdings }, request) => {
    if (request.queryParams.query) {
      const cqlParser = new CQLParser();
      cqlParser.parse(request.queryParams.query);
      const { field, term } = cqlParser.tree;
      return holdings.where({ [field]: term });
    } else {
      return holdings.all();
    }
  });
}
