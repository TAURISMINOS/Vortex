import { setSettingsPage } from '../../actions/session';
import { II18NProps } from '../../types/II18NProps';
import { ComponentEx, connect, extend, translate } from '../../util/ComponentEx';
import * as selectors from '../../util/selectors';
import Icon from '../../views/Icon';
import More from '../../views/More';
import { IconButton } from '../../views/TooltipControls';

import getTextModManagement from '../mod_management/texts';
import getTextProfiles from '../profile_management/texts';

import { dismissStep } from './actions';

import * as React from 'react';
import { Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import { Interpolate } from 'react-i18next';
import * as Redux from 'redux';

export interface IBaseProps { }

interface IExtendedProps {
  objects: IToDo[];
}

interface IConnectedState {
  gameMode: string;
  basePath: string;
  autoDeploy: boolean;
  profilesVisible: boolean;
  dismissAll: boolean;
  steps: { [stepId: string]: boolean };
  searchPaths: string[];
  discoveryRunning: boolean;
  multiUser: boolean;
  __extensionProps?: any[];
}

interface IActionProps {
  onDismissStep: (step: string) => void;
  onSetSettingsPage: (pageId: string) => void;
}

type IProps = IBaseProps & IExtendedProps & IConnectedState & IActionProps & II18NProps;

interface IToDo {
  id: string;
  props?: () => any;
  condition: (props: any) => boolean;
  render: (props: any) => JSX.Element;
  priority?: number;
}

class Dashlet extends ComponentEx<IProps, {}> {
  private mTodos: IToDo[];

  constructor(inProps: IProps) {
    super(inProps);

    this.mTodos = [
      {
        id: 'multi-user',
        condition: props => true,
        priority: 10,
        render: (props: IProps): JSX.Element => {
          const { t, multiUser } = props;
          const link =
            <a onClick={this.openVortexSettings}><Icon name='sliders' />{' '}{t('Settings')}</a>;

          const mode = multiUser ? t('Shared') : t('Per-user');

          return (
            <span>
              <Interpolate
                i18nKey='You are currently in {{mode}} mode. Open {{link}} to change.'
                link={link}
                mode={mode}
              />
            </span>
          );
        },
      },
      {
        id: 'pick-game',
        condition: (props: IProps) => props.gameMode === undefined,
        render: (props: IProps): JSX.Element => {
          const { t } = props;
          const link = <a onClick={this.openGames}><Icon name='gamepad' />{' '}{t('Games')}</a>;

          return (
            <span>
              <Interpolate
                i18nKey='Open {{link}} to select a game to manage'
                link={link}
              />
            </span>
          );
        },
      },
      {
        id: 'paths',
        condition: (props: IProps) => props.gameMode !== undefined,
        render: (props: IProps): JSX.Element => {
          const { t, basePath } = props;
          const path = <strong>{basePath}</strong>;
          const link = (
            <a onClick={this.openModsSettings}><Icon name='sliders' />{' '}{t('Settings')}</a>
          );

          return (
            <span>
              <Interpolate
                i18nKey='Data for this game will be stored in {{path}}\nOpen {{link}} to change.'
                path={path}
                link={link}
              />
            </span>
          );
        },
      },
      {
        id: 'manual-search',
        condition: (props: IProps) => props.searchPaths !== undefined,
        render: (props: IProps): JSX.Element => {
          const { t, discoveryRunning, searchPaths } = props;

          if (discoveryRunning) {
            return (
              <span>
                <a onClick={this.openGames}>
                  {t('Discovery running')}<Icon name='spinner' pulse />
                </a>
              </span>
            );
          } else {
            const gameModeLink =
              <a onClick={this.openGames}><Icon name='gamepad' />{' '}{t('discovered')}</a>;
            const searchLink = (
              <a onClick={this.startManualSearch}>
                <Icon name='search' />
                {t('search your disks')}
              </a>
            );
            const settingsLink = (
              <a onClick={this.openGameSettings}>
                <Icon name='sliders' />
                {searchPaths.sort().join(', ')}
              </a>
            );

            const text = 'If games you have installed weren\'t {{discovered}}, '
              + 'Vortex can {{search}} for them. This can take some time. '
              + 'Currenty these directories will be searched: {{settings}}.';

            return (
              <span>
                <Interpolate
                  i18nKey={text}
                  discovered={gameModeLink}
                  search={searchLink}
                  settings={settingsLink}
                />
              </span>
            );
          }
        },
      },
      {
        id: 'deploy-automation',
        condition: (props: IProps) => true,
        render: (props: IProps): JSX.Element => {
          const { t, autoDeploy } = props;
          const enabled = autoDeploy ? t('enabled') : t('disabled');
          const link =
            <a onClick={this.openInterfaceSettings}><Icon name='sliders' />{' '}{t('Settings')}</a>;
          const more = (
            <More id='more-deploy-dash' name={t('Deployment')}>
              {getTextModManagement('deployment', t)}
            </More>
          );
          return (
            <span>
              <Interpolate
                i18nKey='Automatic deployment{{more}} is {{enabled}}. Open {{link}} to change.'
                more={more}
                enabled={enabled}
                link={link}
              />
            </span>
          );
        },
      },
      {
        id: 'profile-visibility',
        condition: (props: IProps) => !props.profilesVisible,
        render: (props: IProps): JSX.Element => {
          const { t } = props;
          const link =
            <a onClick={this.openInterfaceSettings}><Icon name='sliders' />{' '}{t('Settings')}</a>;
          const more = (
            <More id='more-profiles-dash' name={t('Profiles')}>
              {getTextProfiles('profiles', t)}
            </More>
          );
          return (
            <span>
              <Interpolate
                i18nKey='Profile Management{{more}} is disabled. Open {{link}} to enable.'
                more={more}
                link={link}
              />
            </span>
          );
        },
      },
    ].concat(this.props.objects);
  }

  public render(): JSX.Element {
    const { t, dismissAll, steps } = this.props;

    if (dismissAll) {
      return null;
    }

    const visibleSteps = this.mTodos.filter(
      (step) => {
        if (steps[step.id]) {
          return false;
        }

        const props = step.props ? step.props() : this.props;
        return step.condition(props);
      });

    visibleSteps.sort((lhs, rhs) => (lhs.priority || 100) - (rhs.priority || 100));

    return (
      <ListGroup>
        {
          visibleSteps.map((step) => {
            const props = step.props ? step.props() : this.props;

            return (
              <ListGroupItem key={step.id}>
                {step.render(props)}
                <IconButton
                  id={`btn-dismiss-${step.id}`}
                  icon='remove'
                  tooltip={t('Dismiss')}
                  className='close-button btn-embed'
                  value={step.id}
                  onClick={this.dismiss}
                />
              </ListGroupItem>
            );
          })
        }
      </ListGroup>
    );
  }

  private openGameSettings = () => {
    this.context.api.events.emit('show-main-page', 'Settings');
    this.props.onSetSettingsPage('Games');
  }

  private openModsSettings = () => {
    this.context.api.events.emit('show-main-page', 'Settings');
    this.props.onSetSettingsPage('Mods');
  }

  private openInterfaceSettings = () => {
    this.context.api.events.emit('show-main-page', 'Settings');
    this.props.onSetSettingsPage('Interface');
  }

  private openVortexSettings = () => {
    this.context.api.events.emit('show-main-page', 'Settings');
    this.props.onSetSettingsPage('Vortex');
  }

  private startManualSearch = () => {
    this.context.api.events.emit('start-discovery');
  }

  private openGames = () => {
    this.context.api.events.emit('show-main-page', 'Games');
  }

  private dismiss = (evt: React.MouseEvent<any>) => {
    const stepId = evt.currentTarget.value;
    this.props.onDismissStep(stepId);
  }
}

function mapStateToProps(state: any, ownProps: IBaseProps & IExtendedProps): IConnectedState {
  const objects = ownProps.objects || [];
  return {
    gameMode: selectors.activeGameId(state),
    basePath: selectors.basePath(state),
    multiUser: state.user.multiUser,
    autoDeploy: state.settings.automation.deploy,
    profilesVisible: state.settings.interface.profilesVisible,
    dismissAll: state.settings.firststeps.dismissAll,
    steps: state.settings.firststeps.steps,
    searchPaths: state.settings.gameMode.searchPaths,
    discoveryRunning: state.session.discovery.running,
    __extensionProps: objects.map(ext => ext.props()),
  };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<any>): IActionProps {
  return {
    onDismissStep: (step: string) => dispatch(dismissStep(step)),
    onSetSettingsPage: (pageId: string) => dispatch(setSettingsPage(pageId)),
  };
}

function registerToDo(instanceProps: IBaseProps,
                      id: string,
                      props: () => any,
                      condition: (props: any) => boolean,
                      render: (props: any) => JSX.Element,
                      priority?: number): IToDo {
  return { id, props, condition, render, priority };
}

export default translate(['common'], { wait: true })(
  extend(registerToDo)(
    connect(mapStateToProps, mapDispatchToProps)(
      Dashlet))) as React.ComponentClass<IBaseProps>;
