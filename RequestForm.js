import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Field } from 'redux-form';
import queryString from 'query-string';

import { Accordion, AccordionSet } from '@folio/stripes-components/lib/Accordion';
import Button from '@folio/stripes-components/lib/Button';
import Datepicker from '@folio/stripes-components/lib/Datepicker';
import KeyValue from '@folio/stripes-components/lib/KeyValue';
import Pane from '@folio/stripes-components/lib/Pane';
import Paneset from '@folio/stripes-components/lib/Paneset';
import PaneMenu from '@folio/stripes-components/lib/PaneMenu';
import Pluggable from '@folio/stripes-components/lib/Pluggable';
import Select from '@folio/stripes-components/lib/Select';
import TextField from '@folio/stripes-components/lib/TextField';
import { Row, Col } from '@folio/stripes-components/lib/LayoutGrid';

import stripesForm from '@folio/stripes-form';

import CancelRequestDialog from './CancelRequestDialog';
import UserDetail from './UserDetail';
import ItemDetail from './ItemDetail';
import { toUserAddress } from './constants';

/**
 * on-blur validation checks that the requested item is checked out
 * and that the requesting user exists.
 *
 * redux-form requires that the rejected Promises have the form
 * { field: "error message" }
 * hence the eslint-disable-next-line comments since ESLint is picky
 * about the format of rejected promises.
 *
 * @see https://redux-form.com/7.3.0/examples/asyncchangevalidation/
 */
function asyncValidate(values, dispatch, props, blurredField) {
  if (blurredField === 'item.barcode') {
    return new Promise((resolve, reject) => {
      const uv = props.uniquenessValidator.itemUniquenessValidator;
      const query = `(barcode="${values.item.barcode}")`;
      uv.reset();
      uv.GET({ params: { query } }).then((items) => {
        if (items.length < 1) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({ item: { barcode: 'Item with this barcode does not exist' } });
        } else if (items[0].status.name !== 'Checked out' &&
                   items[0].status.name !== 'Checked out - Held' &&
                   items[0].status.name !== 'Checked out - Recalled') {
          if (values.requestType === 'Recall') {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject({ item: { barcode: 'Only checked out items can be recalled' } });
          } else if (values.requestType === 'Hold') {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject({ item: { barcode: 'Only checked out items can be held' } });
          }
        } else {
          resolve();
        }
      });
    });
  } else if (blurredField === 'requester.barcode') {
    return new Promise((resolve, reject) => {
      const uv = props.uniquenessValidator.userUniquenessValidator;
      const query = `(barcode="${values.requester.barcode}")`;
      uv.reset();
      uv.GET({ params: { query } }).then((users) => {
        if (users.length < 1) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({ requester: { barcode: 'User with this barcode does not exist' } });
        } else {
          resolve();
        }
      });
    });
  }

  return new Promise(resolve => resolve());
}

class RequestForm extends React.Component {
  static propTypes = {
    stripes: PropTypes.shape({
      intl: PropTypes.object.isRequired,
    }).isRequired,
    change: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    findResource: PropTypes.func,
    fullRequest: PropTypes.object,
    metadataDisplay: PropTypes.func,
    initialValues: PropTypes.object,
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
    }).isRequired,
    onCancel: PropTypes.func.isRequired,
    pristine: PropTypes.bool,
    submitting: PropTypes.bool,
    //  okapi: PropTypes.object,
    optionLists: PropTypes.shape({
      addressTypes: PropTypes.arrayOf(PropTypes.object),
      requestTypes: PropTypes.arrayOf(PropTypes.object),
      fulfilmentTypes: PropTypes.arrayOf(PropTypes.object),
    }),
    patronGroups: PropTypes.shape({
      hasLoaded: PropTypes.bool.isRequired,
      isPending: PropTypes.bool.isPending,
      other: PropTypes.shape({
        totalRecords: PropTypes.number,
      }),
    }).isRequired,
    dateFormatter: PropTypes.func.isRequired,
  };

  static defaultProps = {
    findResource: () => {},
    fullRequest: null,
    initialValues: {},
    metadataDisplay: () => {},
    optionLists: {},
    pristine: true,
    submitting: false,
  };

  constructor(props) {
    super(props);

    let requester;
    let item;
    let loan;
    let instance;
    let holding;
    if (props.fullRequest) {
      requester = props.fullRequest.requester;
      item = props.fullRequest.item;
      loan = props.fullRequest.loan;
      instance = props.fullRequest.instance;
      holding = props.fullRequest.holding;
    }
    const {
      fulfilmentPreference,
      deliveryAddressTypeId,
    } = props.initialValues;

    this.state = {
      accordions: {
        'request-info': true,
        'item-info': true,
        'requester-info': true,
      },
      selectedDelivery: fulfilmentPreference === 'Delivery',
      selectedAddressTypeId: deliveryAddressTypeId,
      selectedItem: item,
      selectedInstance: instance,
      selectedHolding: holding,
      selectedUser: requester,
      proxy: {},
      selectedLoan: loan,
    };

    this.onChangeAddress = this.onChangeAddress.bind(this);
    this.onChangeFulfilment = this.onChangeFulfilment.bind(this);
    this.onItemClick = this.onItemClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onSelectUser = this.onSelectUser.bind(this);
    this.onToggleSection = this.onToggleSection.bind(this);
    this.onUserClick = this.onUserClick.bind(this);
  }

  componentDidUpdate(prevProps) {
    const initials = this.props.initialValues;
    const fullRequest = this.props.fullRequest;
    const oldInitials = prevProps.initialValues;
    const oldRecord = prevProps.fullRequest;
    if ((initials && initials.fulfilmentPreference &&
        oldInitials && !oldInitials.fulfilmentPreference) ||
        (fullRequest && !oldRecord)) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        selectedAddressTypeId: initials.deliveryAddressTypeId,
        selectedDelivery: initials.fulfilmentPreference === 'Delivery',
        selectedItem: fullRequest.item,
        selectedInstance: fullRequest.instance,
        selectedHolding: fullRequest.holding,
        selectedLoan: fullRequest.loan,
        selectedUser: fullRequest.user,
      });
    }
  }

  onToggleSection({ id }) {
    this.setState((curState) => {
      const newState = _.cloneDeep(curState);
      newState.accordions[id] = !curState.accordions[id];
      return newState;
    });
  }

  onChangeFulfilment(e) {
    this.setState({
      selectedDelivery: e.target.value === 'Delivery',
    });
  }

  onChangeAddress(e) {
    this.setState({
      selectedAddressTypeId: e.target.value,
    });
  }

  // This function is called from the "search and select user" widget when
  // a user has been selected from the list
  onSelectUser(user) {
    if (user) {
      // Set the new value in the redux-form barcode field
      this.props.change('requester.barcode', user.barcode);
      setTimeout(() => this.onUserClick());
    }
  }

  onUserClick(proxyUser = null) {
    this.setState({ selectedUser: null, proxy: null });
    const barcode = this.requesterBarcodeField.value;

    this.props.findResource('user', barcode, 'barcode').then((result) => {
      if (result.totalRecords === 1) {
        const user = result.users[0];
        if (proxyUser && proxyUser.id) {
          // the ProxyManager has been used to select a role for this user,
          // so figure out if user is a proxy or not
          if (proxyUser.id === user.id) {
            // Selected user is acting as self, so there is no proxy
            this.setState({
              selectedUser: user,
              proxy: user,
            });
            this.props.change('requesterId', user.id);
          } else {
            this.setState({
              selectedUser: proxyUser,
              proxy: user,
            });
            this.props.change('requesterId', proxyUser.id);
            this.props.change('proxyUserId', user.id);
          }
        } else {
          this.setState({
            selectedUser: user,
          });
          this.props.change('requesterId', user.id);
        }
      }
    });
  }

  onItemClick() {
    this.setState({ selectedItem: null });
    const { findResource } = this.props;
    const barcode = this.itemBarcodeField.getRenderedComponent().input.value;

    findResource('item', barcode, 'barcode').then((result) => {
      if (result.totalRecords === 1) {
        const item = result.items[0];
        this.props.change('itemId', item.id);

        // Setting state here is redundant with what follows, but it lets us
        // display the matched item as quickly as possible, without waiting for
        // the slow loan and request lookups
        this.setState({
          selectedItem: item,
        });

        return Promise.all(
          [
            findResource('loan', item.id),
            findResource('requestsForItem', item.id),
            findResource('instance', item.instanceId),
            findResource('holding', item.holdingsRecordId),
          ],
        ).then((resultArray) => {
          const loan = resultArray[0].loans[0];
          const itemRequestCount = resultArray[1].requests.length;
          const instance = resultArray[2];
          const holding = resultArray[3];
          if (loan) {
            this.setState({
              selectedItem: item,
              selectedInstance: instance,
              selectedHolding: holding,
              selectedLoan: loan,
              itemRequestCount,
            });
          }
          // If no loan is found, just set the item and related record(s) and rq count
          this.setState({
            selectedItem: item,
            selectedInstance: instance,
            selectedHolding: holding,
            itemRequestCount,
          });

          return result;
        });
      }

      return result;
    });
  }

  // This function only exists to enable 'do lookup on enter' for item and
  // user search
  onKeyDown(e, element) {
    if (e.key === 'Enter' && e.shiftKey === false) {
      e.preventDefault();
      if (element === 'item') {
        this.onItemClick();
      } else {
        this.onUserClick();
      }
    }
  }

  requireItem = value => (value ? undefined : 'Please select an item');
  requireUser = value => (value ? undefined : 'Please select a requester');

  render() {
    const {
      handleSubmit,
      fullRequest,
      onCancel,
      optionLists,
      patronGroups,
      pristine,
      submitting,
      stripes: { intl },
    } = this.props;

    let requestMeta;
    let item;
    let requestType;
    let fulfilmentPreference;
    if (fullRequest) {
      requestMeta = fullRequest.requestMeta;
      item = fullRequest.item;
      requestType = requestMeta.requestType;
      fulfilmentPreference = requestMeta.fulfilmentPreference;
    }

    const { selectedUser } = this.state;
    const { location } = this.props;

    const isEditForm = (item && item.id);
    const query = location.search ? queryString.parse(location.search) : {};

    const addRequestFirstMenu = <PaneMenu><Button onClick={onCancel} title="close" aria-label="Close New Request Dialog"><span style={{ fontSize: '30px', color: '#999', lineHeight: '18px' }} >&times;</span></Button></PaneMenu>;
    const addRequestLastMenu = <PaneMenu><Button id="clickable-create-request" type="button" title="Create New Request" disabled={pristine || submitting} onClick={handleSubmit}>Create Request</Button></PaneMenu>;
    const editRequestLastMenu = <PaneMenu><Button id="clickable-update-request" type="button" title="Update Request" disabled={pristine || submitting} onClick={handleSubmit}>Update Request</Button></PaneMenu>;
    const requestTypeOptions = _.sortBy(optionLists.requestTypes || [], ['label']).map(t => ({ label: t.label, value: t.id, selected: requestType === t.id }));
    const fulfilmentTypeOptions = _.sortBy(optionLists.fulfilmentTypes || [], ['label']).map(t => ({ label: t.label, value: t.id, selected: t.id === fulfilmentPreference }));
    const labelAsterisk = isEditForm ? '' : '*';
    const disableRecordCreation = true;

    let deliveryLocations;
    let deliveryLocationsDetail = [];
    let addressDetail;
    if (selectedUser && selectedUser.personal && selectedUser.personal.addresses) {
      deliveryLocations = selectedUser.personal.addresses.map((a) => {
        const typeName = _.find(optionLists.addressTypes.records, { id: a.addressTypeId }).addressType;
        return { label: typeName, value: a.addressTypeId };
      });
      deliveryLocations = _.sortBy(deliveryLocations, ['label']);
      deliveryLocationsDetail = _.keyBy(selectedUser.personal.addresses, a => a.addressTypeId);
    }
    if (this.state.selectedAddressTypeId) {
      addressDetail = toUserAddress(deliveryLocationsDetail[this.state.selectedAddressTypeId]);
    }

    let patronGroupName;
    if (patronGroups && this.state.selectedUser) {
      const group = patronGroups.records.find(g => g.id === this.state.selectedUser.patronGroup);
      if (group) { patronGroupName = group.desc; }
    }

    // map column-IDs to table-header-values
    const columnMapping = {
      name: intl.formatMessage({ id: 'ui-requests.user.name' }),
      patronGroup: intl.formatMessage({ id: 'ui-requests.user.patronGroup' }),
      username: intl.formatMessage({ id: 'ui-requests.user.username' }),
      barcode: intl.formatMessage({ id: 'ui-requests.user.barcode' }),
    };

    return (
      <form id="form-requests" style={{ height: '100%', overflow: 'auto' }}>
        <Paneset isRoot>
          <Pane
            defaultWidth="100%"
            height="100%"
            firstMenu={addRequestFirstMenu}
            lastMenu={isEditForm ? editRequestLastMenu : addRequestLastMenu}
            paneTitle={isEditForm ? 'Edit request' : 'New request'}
            actionMenuItems={[{
              id: 'clickable-cancel-request',
              title: intl.formatMessage({ id: 'ui-requests.cancel.cancelRequest' }),
              label: intl.formatMessage({ id: 'ui-requests.cancel.cancel' }),
              onClick: () => this.setState({ isCancellingRequest: true }),
              icon: 'cancel',
            }]}
          >
            <AccordionSet accordionStatus={this.state.accordions} onToggle={this.onToggleSection}>
              <Accordion
                open
                id="request-info"
                label="Request information"
              >
                { isEditForm && requestMeta && requestMeta.metadata &&
                  <Col xs={12}>
                    <this.props.metadataDisplay metadata={requestMeta.metadata} />
                  </Col>
                }
                <Row>
                  <Col xs={8}>
                    <Row>
                      <Col xs={3}>
                        { !isEditForm &&
                          <Field
                            label="Request type"
                            name="requestType"
                            component={Select}
                            fullWidth
                            dataOptions={requestTypeOptions}
                            disabled={isEditForm}
                          />
                        }
                        { isEditForm &&
                          <KeyValue label="Request type" value={requestMeta.requestType} />
                        }
                      </Col>
                      <Col xs={3}>
                        { isEditForm &&
                          <KeyValue label="Request status" value={requestMeta.status} />
                        }
                      </Col>
                      <Col xs={3}>
                        <Field
                          name="requestExpirationDate"
                          label="Request expiration date"
                          aria-label="Request expiration date"
                          backendDateStandard="YYYY-MM-DD"
                          component={Datepicker}
                        />
                      </Col>
                      { isEditForm && requestMeta.status === 'Open - Awaiting pickup' &&
                        <Col xs={3}>
                          <Field
                            name="holdShelfExpirationDate"
                            label="Hold shelf expiration date"
                            aria-label="Hold shelf expiration date"
                            backendDateStandard="YYYY-MM-DD"
                            component={Datepicker}
                          />
                        </Col>
                      }
                    </Row>
                    { isEditForm &&
                      <Row>
                        <Col xs={3}>
                          <KeyValue label="Position in queue" value="-" />
                        </Col>
                      </Row>
                    }
                  </Col>
                </Row>
              </Accordion>
              <Accordion
                open
                id="item-info"
                label={`Item information ${labelAsterisk}`}
              >
                <div id="section-item-info">
                  <Row>
                    <Col xs={12}>
                      {!isEditForm &&
                        <Row>
                          <Col xs={9}>
                            <Field
                              name="item.barcode"
                              placeholder="Scan or enter item barcode"
                              aria-label="Item barcode"
                              fullWidth
                              component={TextField}
                              withRef
                              ref={(input) => { this.itemBarcodeField = input; }}
                              onInput={this.onItemClick}
                              onKeyDown={e => this.onKeyDown(e, 'item')}
                              validate={this.requireItem}
                            />
                          </Col>
                          <Col xs={3}>
                            <Button
                              id="clickable-select-item"
                              buttonStyle="primary noRadius"
                              fullWidth
                              onClick={this.onItemClick}
                              disabled={submitting}
                            >Enter
                            </Button>
                          </Col>
                        </Row>
                      }
                      { this.state.selectedItem &&
                        <ItemDetail
                          item={fullRequest ? fullRequest.item : this.state.selectedItem}
                          holding={fullRequest ? fullRequest.holding : this.state.selectedHolding}
                          instance={fullRequest ? fullRequest.instance : this.state.selectedInstance}
                          loan={fullRequest ? fullRequest.loan : this.state.selectedLoan}
                          dateFormatter={this.props.dateFormatter}
                          requestCount={fullRequest ? fullRequest.requestCount : this.state.itemRequestCount}
                        />
                      }
                    </Col>
                  </Row>
                </div>
              </Accordion>
              <Accordion
                open
                id="requester-info"
                label={`Requester information ${labelAsterisk}`}

              >
                <div id="section-requester-info">
                  <Row>
                    <Col xs={12}>
                      {!isEditForm &&
                        <Row>
                          <Col xs={9}>
                            <Field
                              name="requester.barcode"
                              placeholder="Scan or enter requester barcode"
                              aria-label="Requester barcode"
                              fullWidth
                              component={TextField}
                              withRef
                              ref={(input) => { this.requesterBarcodeField = input; }}
                              onInput={this.onUserClick}
                              onKeyDown={e => this.onKeyDown(e, 'requester')}
                              validate={this.requireUser}
                            />
                            <Pluggable
                              aria-haspopup="true"
                              type="find-user"
                              searchLabel="Requester look-up"
                              marginTop0
                              searchButtonStyle="link"
                              {...this.props}
                              dataKey="users"
                              selectUser={this.onSelectUser}
                              disableRecordCreation={disableRecordCreation}
                              visibleColumns={['name', 'patronGroup', 'username', 'barcode']}
                              columnMapping={columnMapping}
                            />

                          </Col>
                          <Col xs={3}>
                            <Button
                              id="clickable-select-requester"
                              buttonStyle="primary noRadius"
                              fullWidth
                              onClick={this.onUserClick}
                              disabled={submitting}
                            >Enter
                            </Button>
                          </Col>
                        </Row>
                      }
                      { this.state.selectedUser &&
                        <UserDetail
                          user={fullRequest ? fullRequest.requester : this.state.selectedUser}
                          stripes={this.props.stripes}
                          requestMeta={fullRequest ? fullRequest.requestMeta : {}}
                          newUser={!!query.layer}
                          patronGroup={patronGroupName}
                          selectedDelivery={this.state.selectedDelivery}
                          deliveryAddress={addressDetail}
                          deliveryLocations={deliveryLocations}
                          fulfilmentTypeOptions={fulfilmentTypeOptions}
                          onChangeAddress={this.onChangeAddress}
                          onChangeFulfilment={this.onChangeFulfilment}
                          proxy={fullRequest ? fullRequest.requestMeta.proxy : this.state.proxy}
                          onSelectProxy={this.onUserClick}
                          onCloseProxy={() => { this.setState({ selectedUser: null, proxy: null }); }}
                        />
                      }
                    </Col>
                  </Row>
                </div>
              </Accordion>
            </AccordionSet>
          </Pane>
          <CancelRequestDialog
            open={this.state.isCancellingRequest}
            onClose={() => this.setState({ isCancellingRequest: false })}
            request={fullRequest}
          />

          <br /><br /><br /><br /><br />
        </Paneset>
      </form>
    );
  }
}

export default stripesForm({
  form: 'requestForm',
  asyncValidate,
  asyncBlurFields: ['item.barcode', 'requester.barcode'],
  navigationCheck: true,
  enableReinitialize: true,
  keepDirtyOnReinitialize: true,
})(RequestForm);
