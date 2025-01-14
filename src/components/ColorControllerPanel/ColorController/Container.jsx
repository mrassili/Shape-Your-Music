import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Tone from 'tone';
import ColorControllerComponent from './Component';
import PRESETS from 'presets';
const propTypes = {
  color: PropTypes.string.isRequired,
  receiveChannel: PropTypes.string.isRequired,
  knobVals: PropTypes.array.isRequired,
  synthParams: PropTypes.shape({
    name: PropTypes.string.isRequired,
    baseSynth: PropTypes.func.isRequired,
    dynamicParams: PropTypes.array.isRequired,
    effects: PropTypes.array,
  }).isRequired,
  onInstChange: PropTypes.func.isRequired,
  onKnobChange: PropTypes.func.isRequired,
};

const knobIndexChanged = (currVals, nextVals) => {
  for (var i = 0; i < currVals.length; i++) {
    if (currVals[i] !== nextVals[i]) {
      return i;
    }
  }
  return -1;
};

class ColorController extends Component {
  constructor(props) {
    super(props);

    this.fxList = [];
    this.fxBus = new Tone.Gain(0.8);
    this.fxBus.receive(this.props.receiveChannel);

    this.output = new Tone.Gain(1);
    this.output.send('masterOutput', 0);
    this.connectEffects(props.synthParams.effects);
    this.disposeEffects = this.disposeEffects.bind(this);

    this.handleInstChange = this.handleInstChange.bind(this);
    this.handleIncrementClick = this.handleIncrementClick.bind(this);
  }

  componentDidMount() {
    this.props.knobVals.forEach((val, i) => {
      this.triggerEffectCallback(this.props.synthParams, i, val);
    });
  }

  componentWillReceiveProps(nextProps) {
    // Change instrument
    if (nextProps.synthParams.name !== this.props.synthParams.name) {
      this.connectEffects(nextProps.synthParams.effects);
      nextProps.knobVals.forEach((val, i) => {
        this.triggerEffectCallback(nextProps.synthParams, i, val);
      });
    }

    // change knob effect
    const changedKnobIndex = knobIndexChanged(
      this.props.knobVals,
      nextProps.knobVals
    );
    if (!this.props.knobVals || changedKnobIndex >= 0) {
      const val = nextProps.knobVals[changedKnobIndex];
      this.triggerEffectCallback(nextProps.synthParams, changedKnobIndex, val);
    }
  }

  componentWillUnmount(nextProps, nextState) {
    this.disposeEffects();
    this.output.disconnect();
    this.output.dispose();
  }

  disposeEffects() {
    this.fxBus.disconnect();
    this.fxBus.dispose();
    if (this.fxList) {
      this.fxList.forEach(effect => {
        effect.disconnect();
        effect.dispose();
      });
      this.fxList = [];
    }
  }

  triggerEffectCallback(synthParams, knobIndex, val) {
    const targetParam = synthParams.dynamicParams[knobIndex];
    // change effect amount
    // synth parameters are handled by shapes
    if (targetParam.target === 'effect') {
      targetParam.func(this, val);
    }
  }

  // called by the callbacks in the synthParams object
  // TODO figure out better way?
  setEffectAmount(effectIndex, val, parameter) {
    this.fxList[effectIndex].set(parameter, val);
  }

  connectEffects(fxConstructors) {
    this.disposeEffects();

    this.fxBus = new Tone.Gain(0.8);
    this.fxBus.receive(this.props.receiveChannel);

    fxConstructors.forEach(fxObj => {
      const newEffect = new fxObj.type(fxObj.params);
      this.fxList.push(newEffect);
    });

    // TODO
    if (this.fxList.length === 2) {
      this.fxBus.chain(this.fxList[0], this.fxList[1], this.output);
    } else if (this.fxList.length === 1) {
      this.fxBus.chain(this.fxList[0], this.output);
    } else {
      this.fxBus.chain(this.output);
    }
  }

  handleInstChange(option) {
    if (option) {
      this.props.onInstChange(option.value);
    }
  }

  handleIncrementClick(difference) {
    return () => {
      const { synthParams, onInstChange } = this.props;

      const currentVal = synthParams.name;
      const currentIndex = PRESETS.findIndex(
        preset => preset.name === currentVal
      );
      const numOptions = PRESETS.length - 1;

      let nextVal = currentIndex + difference;

      if (nextVal > numOptions) {
        nextVal = 0;
      }
      if (nextVal < 0) {
        nextVal = numOptions;
      }

      onInstChange(PRESETS[nextVal].name);
    };
  }

  render() {
    return (
      <ColorControllerComponent
        {...this.props}
        onInstChange={this.handleInstChange}
        onIncrementClick={this.handleIncrementClick}
      />
    );
  }
}

ColorController.propTypes = propTypes;

export default ColorController;
