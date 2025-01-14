import React from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';

import { appColors, getDarker } from 'utils/color';
import styles from './styles.module.css';

const propTypes = {
  menuTop: PropTypes.bool,
  color: PropTypes.string,
  title: PropTypes.string,
  value: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};

function CustomSelect(props) {
  const { white, black, grayLightest } = appColors;
  const backgroundColor = props.color || grayLightest;

  const borderColor = props.color ? getDarker(props.color) : white;
  const foreground = props.color ? white : black;
  const fontWeight = props.color ? 'bold' : 'normal';
  const arrowRenderer = ({ isOpen }) => (
    <div
      style={{
        color: foreground,
        fontSize: 15,
      }}
    >
      {isOpen ? (
        <i className="ion-chevron-up" />
      ) : (
        <i className="ion-chevron-down" />
      )}
    </div>
  );
  arrowRenderer.propTypes = { isOpen: PropTypes.bool };

  const position = props.menuTop
    ? {
        top: 'auto',
        bottom: 'calc(100% + 2px)',
      }
    : {
        bottom: 'auto',
        top: 'calc(100% + 3px)',
      };

  return (
    <Select
      {...props}
      className={styles.customSelect}
      wrapperStyle={{ height: '100%', fontWeight }}
      menuContainerStyle={{
        marginBottom: 'none',
        ...position,
      }}
      optionClassName={props.color ? styles.lightText : styles.darkText}
      valueRenderer={value => (
        <div
          title={props.title}
          style={{
            backgroundColor: backgroundColor,
            color: foreground,
            height: '100%',
            width: '100%',
            padding: 3,
            paddingTop: 4,
            paddingLeft: 6,
            display: 'grid',
            alignItems: 'center',
            border: !props.color && `1px solid ${getDarker(backgroundColor)}`,
            borderRadius: !props.color && 1,
          }}
        >
          {value.label}
        </div>
      )}
      arrowRenderer={arrowRenderer}
      menuStyle={{
        border: `2px solid ${borderColor}`,
        background: backgroundColor,
        margin: -3,
        boxShadow: '-5px 0 12px 0 rgba(0,0,0,0.11)',
      }}
      searchable={false}
      clearable={false}
      value={props.options.find(({ value }) => value === props.value)}
      options={props.options}
      onChange={props.onChange}
    />
  );
}

CustomSelect.propTypes = propTypes;

export default CustomSelect;
