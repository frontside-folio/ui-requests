import {
  interactor,
  clickable,
  isPresent,
  text,
  value,
  fillable,
  triggerable,
  selectable,
  blurrable,
} from '@bigtest/interactor';

import { getSelectValues } from './helpers';

@interactor class HeaderDropdown {
  click = clickable('button');
}

@interactor class HeaderDropdownMenu {
  clickCancel = clickable('[data-test-cancel-new-request-action]');
}

@interactor class InputFieldInteractor {
  clickInput = clickable();
  fillInput = fillable();
  blurInput = blurrable();

  pressEnter = triggerable('keydown', {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
    key: 'Enter',
  });

  fillAndBlur(val) {
    return this
      .clickInput()
      .fillInput(val)
      .pressEnter()
      .blurInput();
  }
}

@interactor class NewRequestsInteractor {
  pressEnter = triggerable('keydown', {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
    key: 'Enter',
  });

  clickItemEnterBtn = clickable('#clickable-select-item');
  clickUserEnterBtn = clickable('#clickable-select-requester');

  title = text('[class*=paneTitleLabel---]');
  headerDropdown = new HeaderDropdown('[class*=paneHeaderCenterInner---] [class*=dropdown---]');
  headerDropdownMenu = new HeaderDropdownMenu();
  requestTypeMessageIsPresent = isPresent('[data-test-request-type-message]');
  itemBarcodeIsPresent = isPresent('[name="item.barcode"]');
  fillItemBarcode = fillable('[name="item.barcode"]');

  itemField = new InputFieldInteractor('[name="item.barcode"]');

  userBarcodeIsPresent = isPresent('[name="item.barcode"]');
  fillUserBarcode = fillable('[name="requester.barcode"]');
  userField = new InputFieldInteractor('[name="requester.barcode"]');

  chooseServicePoint = selectable('[name="pickupServicePointId"]');
  requestTypes = isPresent('[name="requestType"]');
  requestTypeOptions = getSelectValues('[name="requestType"] option');
  requestTypeText = text('[data-test-request-type-text]');
  requestTypeIsPresent = isPresent('[data-test-request-type-text]');
  clickNewRequest = clickable('#clickable-save-request');
  clickCancel = clickable('#clickable-cancel-request');
  containsUserBarcode = value('[name="requester.barcode"]');
  containsItemBarcode = value('[name="item.barcode"]');

  chooseFulfillmentPreference = selectable('[name="fulfilmentPreference"]');
  chooseDeliveryAddress = selectable('[name="deliveryAddressTypeId"]');
  fulfillmentPreferenceValue = value('[name="fulfilmentPreference"]');
  deliveryAddressTypeIdValue = value('[name="deliveryAddressTypeId"]');
  pickupServicePointIdValue = value('[name="pickupServicePointId"]');

  itemErrorIsPresent = isPresent('#section-item-info [class*=feedbackError---]');
  requesterErrorIsPresent = isPresent('#section-requester-info [class*=feedbackError---]');

  whenRequestTypeIsPresent() {
    return this.when(() => this.requestTypeIsPresent);
  }

  whenRequestTypesArePresent() {
    return this.when(() => this.requestTypes);
  }
}

export default new NewRequestsInteractor('[data-test-requests-form]');
