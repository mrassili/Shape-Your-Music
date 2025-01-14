import React, { Component } from 'react';
import { shape, string, number } from 'prop-types';
import Fullscreen from 'react-full-screen';
import Teoria from 'teoria';
import { HotKeys } from 'react-hotkeys';

import Toolbar from 'components/Toolbar';
import Sidebar from 'components/Sidebar';
import ShapeCanvas from 'components/ShapeCanvas';
import ColorControllerPanel from 'components/ColorControllerPanel';

import { themeColors } from 'utils/color';
import PRESETS from 'presets';
import { keyMap } from './keyMap';
import ProjectContextProvider from './ProjectContextProvider';

/* ========================================================================== */

export const TOOL_TYPES = {
  EDIT: 'edit',
  DRAW: 'draw',
};

/* ========================================================================== */

const propTypes = {
  initState: shape({
    name: string.isRequired,
    tonic: string.isRequired,
    scale: string.isRequired,
    tempo: number.isRequired,
  }).isRequired,
};

class Project extends Component {
  constructor(props) {
    super(props);

    // indeces of default instruments
    const selectedInstruments = [0, 1, 4, 3, 2];
    const knobVals = [];
    selectedInstruments.forEach(instrumentIndex => {
      const instrumentDefaults = PRESETS[instrumentIndex].dynamicParams.map(
        param => param.default
      );
      knobVals.push(instrumentDefaults);
    });

    const { initState } = props;

    const {
      name = 'New project',
      isGridActive = false,
      isSnapToGridActive = false,
      isAutoQuantizeActive = false,
    } = initState;

    this.state = {
      name,
      isGridActive,
      isSnapToGridActive,
      isAutoQuantizeActive,

      isFullscreenEnabled: false,
      isPlaying: false,
      isRecording: false,
      isArmed: false,
      isAltPressed: false,

      quantizeLength: 700,
      tempo: props.initState.tempo,
      scaleObj: Teoria.note(props.initState.tonic).scale(props.initState.scale),
      activeTool: TOOL_TYPES.DRAW,
      activeColorIndex: 0,

      selectedInstruments,
      knobVals,
    };

    // transport
    this.handlePlayClick = this.handlePlayClick.bind(this);
    this.handleRecordClick = this.handleRecordClick.bind(this);
    this.handleChangeDrawColor = this.handleChangeDrawColor.bind(this);
    this.handleAltChange = this.handleAltChange.bind(this);

    // color and tool
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleDrawToolClick = this.handleDrawToolClick.bind(this);
    this.handleEditToolClick = this.handleEditToolClick.bind(this);
    this.toggleActiveTool = this.toggleActiveTool.bind(this);

    // toggles
    this.handleGridToggleChange = this.handleGridToggleChange.bind(this);
    this.handleSnapToGridToggleChange = this.handleSnapToGridToggleChange.bind(
      this
    );
    this.handleAutoQuantizeChange = this.handleAutoQuantizeChange.bind(this);

    // music options
    this.handleTempoChange = this.handleTempoChange.bind(this);
    this.handleTonicChange = this.handleTonicChange.bind(this);
    this.handleScaleChange = this.handleScaleChange.bind(this);

    // inst colors
    this.handleInstChange = this.handleInstChange.bind(this);
    this.handleKnobChange = this.handleKnobChange.bind(this);

    // canvas
    this.handleClearButtonClick = this.handleClearButtonClick.bind(this);
    this.handleFullscreenButtonClick = this.handleFullscreenButtonClick.bind(
      this
    );

    // recorder
    this.beginRecording = this.beginRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);

    // export
    this.handleExportToMIDIClick = this.handleExportToMIDIClick.bind(this);

    // save
    this.handleSaveClick = this.handleSaveClick.bind(this);

    // Key handlers
    this.keyHandlers = {
      PLAY: e => {
        e.preventDefault();
        e.stopPropagation();
        this.handlePlayClick();
      },
      TOGGLE_ACTIVE_TOOL: e => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleActiveTool();
      },
      CHANGE_DRAW_COLOR: this.handleChangeDrawColor,
      ALT_DOWN: () => this.handleAltChange(true),
      ALT_UP: () => this.handleAltChange(false),
      DELETE_SHAPE: () => this.shapeCanvas.deleteSelectedShape(),
    };
  }

  /* ============================== HANDLERS ============================== */

  handleChangeDrawColor({ key }) {
    this.setState({
      activeColorIndex: parseInt(key, 10) - 1,
    });
  }

  handleAltChange(alt) {
    this.setState({ isAltPressed: alt });
  }

  handlePlayClick() {
    const { isArmed, isRecording } = this.state;
    const { toggleTransport } = this.props;
    toggleTransport();

    if (isArmed) {
      this.beginRecording();
    }
    if (isRecording) {
      this.stopRecording();
    }

    this.setState(prevState => ({
      isPlaying: !prevState.isPlaying,
    }));
  }

  handleRecordClick() {
    const { isArmed, isPlaying, isRecording } = this.state;
    if (isRecording) {
      this.stopRecording();
    } else {
      if (isPlaying) {
        this.beginRecording();
      } else {
        this.setState({
          isArmed: !isArmed,
        });
      }
    }
  }

  /* --- Transport -------------------------------------------------------- */

  beginRecording() {
    this.props.beginRecording();
    this.setState({ isRecording: true });
  }

  stopRecording() {
    const { name } = this.state;
    this.props.stopRecording(name);
    this.setState({
      isRecording: false,
      isArmed: false,
    });
  }

  /* --- Tool ------------------------------------------------------------- */

  toggleActiveTool() {
    const { activeTool } = this.state;
    let newTool = TOOL_TYPES.DRAW;
    if (this.shapeCanvas.canChangeTool()) {
      if (activeTool === TOOL_TYPES.DRAW) {
        newTool = TOOL_TYPES.EDIT;
      }
      this.setState({
        activeTool: newTool,
      });
    }
  }

  handleDrawToolClick() {
    this.setActiveTool(TOOL_TYPES.DRAW);
  }

  handleEditToolClick() {
    this.setActiveTool(TOOL_TYPES.EDIT);
  }

  setActiveTool(tool) {
    if (this.shapeCanvas.canChangeTool()) {
      this.setState({
        activeTool: tool,
      });
    }
  }

  handleColorChange(colorObj) {
    this.setState({
      activeColorIndex: themeColors.indexOf(colorObj.hex),
    });
  }

  /* --- Canvas ----------------------------------------------------------- */

  handleGridToggleChange() {
    this.setState({
      isGridActive: !this.state.isGridActive,
    });
  }

  handleSnapToGridToggleChange() {
    this.setState({
      isSnapToGridActive: !this.state.isSnapToGridActive,
    });
  }

  handleAutoQuantizeChange() {
    this.setState({
      isAutoQuantizeActive: !this.state.isAutoQuantizeActive,
    });
  }

  handleClearButtonClick() {
    this.shapeCanvas.clearAll();
  }

  handleFullscreenButtonClick() {
    this.setState({
      isFullscreenEnabled: !this.state.isFullscreenEnabled,
    });
  }

  /* --- Musical ---------------------------------------------------------- */

  handleTempoChange(val) {
    // TODO: move to class variables
    const min = 1;
    const max = 100;
    const tempo = Math.max(Math.min(val, max), min);
    this.setState({ tempo });
  }

  handleTonicChange(val) {
    this.setState(prevState => ({
      scaleObj: Teoria.note(val.value).scale(prevState.scaleObj.name),
    }));
  }

  handleScaleChange(val) {
    if (val) {
      const {
        scaleObj: { tonic },
      } = this.state;
      this.setState({
        scaleObj: tonic.scale(val.value),
      });
    }
  }

  /* --- Export ----------------------- */

  /* Exports (downloads) all shapes as individual MIDI files */
  async handleExportToMIDIClick() {
    const { convertAndDownloadTracksAsMIDI } = this.props;
    const { tempo } = this.state;
    // get list of MIDI events from the shape canvas
    const shapeNoteEventsList = this.shapeCanvas.getShapeMIDINoteEvents();
    await convertAndDownloadTracksAsMIDI({ tempo, shapeNoteEventsList });
  }

  /* --- Color Controllers ------------------------------------------------ */

  handleInstChange(colorIndex) {
    return instrumentName => {
      const instrumentIndex = PRESETS.findIndex(
        ({ name }) => name === instrumentName
      );
      const selectedInstruments = this.state.selectedInstruments.slice();
      selectedInstruments[colorIndex] = instrumentIndex;
      const defaultKnobvals = PRESETS[instrumentIndex].dynamicParams.map(
        param => param.default
      );

      const knobVals = this.state.knobVals.slice();
      knobVals[colorIndex] = defaultKnobvals;

      this.setState({
        selectedInstruments,
        knobVals,
      });
    };
  }

  handleKnobChange(colorIndex) {
    return effectIndex => val => {
      this.setState(prevState => {
        const knobVals = prevState.knobVals.slice();
        const colorKnobVals = knobVals[colorIndex].slice();
        colorKnobVals[effectIndex] = val;
        knobVals[colorIndex] = colorKnobVals;
        return {
          knobVals: knobVals,
        };
      });
    };
  }

  handleSaveClick() {
    const projectContext = this.state;
    const { saveProject } = this.props;
    const screenshot = this.shapeCanvas.getScreenshot();
    console.log('generated screenshot:', screenshot);
    saveProject({
      ...projectContext,
      shapesList: this.shapeCanvas.getShapesList(),
    });
  }

  /* =============================== RENDER =============================== */

  render() {
    const { name, isFullscreenEnabled } = this.state;
    const {
      initState,
      downloadUrls,
      showSaveButton,
      projectAuthor,
    } = this.props;
    const projectContext = this.state;
    console.log(this.props);
    return (
      <HotKeys keyMap={keyMap} handlers={this.keyHandlers}>
        <ProjectContextProvider value={projectContext}>
          <Fullscreen
            enabled={isFullscreenEnabled}
            onChange={isFullscreenEnabled =>
              this.setState({ isFullscreenEnabled })
            }
          >
            {projectAuthor && (
              <div
                style={{
                  display: 'inline-block',
                  maxWidth: 250,
                  textAlign: 'center',
                  position: 'absolute',
                  margin: '0 auto',
                  left: 0,
                  right: 0,
                  top: 5,
                }}
              >
                <strong>{name}</strong> by <em>{projectAuthor.name}</em>
              </div>
            )}

            {/* The Controls */}
            <Toolbar
              handlePlayClick={this.handlePlayClick}
              handleRecordClick={this.handleRecordClick}
              handleColorChange={this.handleColorChange}
              handleDrawToolClick={this.handleDrawToolClick}
              handleEditToolClick={this.handleEditToolClick}
              handleGridToggleChange={this.handleGridToggleChange}
              handleSnapToGridToggleChange={this.handleSnapToGridToggleChange}
              handleAutoQuantizeChange={this.handleAutoQuantizeChange}
              handleTempoChange={this.handleTempoChange}
              handleTonicChange={this.handleTonicChange}
              handleScaleChange={this.handleScaleChange}
              handleFullscreenButtonClick={this.handleFullscreenButtonClick}
              handleClearButtonClick={this.handleClearButtonClick}
              handleExportToMIDIClick={this.handleExportToMIDIClick}
              handleSaveClick={this.handleSaveClick}
              showSaveButton={showSaveButton}
            />

            {/* The Canvas */}
            <ShapeCanvas
              // TODO: revisit: do we need to do this?
              onMount={c => (this.shapeCanvas = c)}
              initShapesList={initState.shapesList}
            />

            {/* Instrument controller panels */}
            <ColorControllerPanel
              onInstChange={this.handleInstChange}
              onKnobChange={this.handleKnobChange}
            />

            {/* Sidebar */}
            <Sidebar downloadUrls={downloadUrls} />
          </Fullscreen>
        </ProjectContextProvider>
      </HotKeys>
    );
  }
}

Project.propTypes = propTypes;

export default Project;
