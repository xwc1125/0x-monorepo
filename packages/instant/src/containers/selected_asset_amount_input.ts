import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { zrxContractAddress, zrxDecimals } from '../constants';
import { Action, actions } from '../redux/actions';
import { State } from '../redux/reducer';
import { ColorOption } from '../style/theme';
import { AsyncProcessState } from '../types';
import { assetBuyer } from '../util/asset_buyer';

import { AmountInput } from '../components/amount_input';

export interface SelectedAssetAmountInputProps {
    fontColor?: ColorOption;
    fontSize?: string;
}

interface ConnectedState {
    value?: BigNumber;
}

interface ConnectedDispatch {
    onChange?: (value?: BigNumber) => void;
}

const mapStateToProps = (state: State, _ownProps: SelectedAssetAmountInputProps): ConnectedState => ({
    value: state.selectedAssetAmount,
});

const updateBuyQuote = async (dispatch: Dispatch<Action>, assetAmount?: BigNumber): Promise<void> => {
    if (_.isUndefined(assetAmount)) {
        return;
    }
    // get a new buy quote.
    const baseUnitValue = Web3Wrapper.toBaseUnitAmount(assetAmount, zrxDecimals);
    const newBuyQuote = await assetBuyer.getBuyQuoteForERC20TokenAddressAsync(zrxContractAddress, baseUnitValue);
    // invalidate the last buy quote.
    dispatch(actions.updateLatestBuyQuote(newBuyQuote));
};

const debouncedUpdateBuyQuote = _.debounce(updateBuyQuote, 200, { trailing: true });

const mapDispatchToProps = (dispatch: Dispatch<Action>): ConnectedDispatch => ({
    onChange: async value => {
        // Update the input
        dispatch(actions.updateSelectedAssetAmount(value));
        // invalidate the last buy quote.
        dispatch(actions.updateLatestBuyQuote(undefined));
        // reset our buy state
        dispatch(actions.updateSelectedAssetBuyState(AsyncProcessState.NONE));
        // tslint:disable-next-line:no-floating-promises
        debouncedUpdateBuyQuote(dispatch, value);
    },
});

export const SelectedAssetAmountInput: React.ComponentClass<SelectedAssetAmountInputProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AmountInput);