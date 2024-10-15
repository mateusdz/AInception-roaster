import type PlaybookHandler from '../../model/PlaybookHandler';
import { AgentInput } from './BasicInputs/AgentInput';
import { CheckboxInput } from './BasicInputs/CheckboxInput';
import { TextFieldInput } from './BasicInputs/TextFieldInput';
import { ComplexInput } from './ComplexInput';
import { PropertyLabel } from './PropertyLabel';

/**
 * Listinput contains a list of inputs. In the PropertyPanel, they can be
 * collapsed and extended. They have a '+' PanelButton to add new elements to
 * the list.
 */
export class ExecutedStatus extends ComplexInput {
	_globalDiv: HTMLElement = document.createElement('div');
	_addFunction!: any;
	_isSTIXId = false;
	_playbookHandler: PlaybookHandler;
	_refreshFunction: any;
	_agent!: AgentInput;
	_stixID!: TextFieldInput;

	constructor(
		propertyName: string,
		propertyType: string,
		playbookHandler: PlaybookHandler,
		container: HTMLElement,
		refreshFunction: any,
	) {
		super(propertyName, propertyType, container);
		this._playbookHandler = playbookHandler;
		this._refreshFunction = refreshFunction;
	}

	addToContainer(): void {
		this.initIsStixID(); /*  */

		this._globalDiv.classList.add('section__property', 'property--simple');

		const labelHeader = document.createElement('div');
		labelHeader.classList.add('property__label', 'status__label');

		const label = new PropertyLabel(
			this._propertyName,
			this._required,
			labelHeader,
			this._description,
		);
		label.addToContainer();

		const toggleContainer = document.createElement('div');

		const toggleLabel = new PropertyLabel('STIX identifier', false, toggleContainer);
		const toggle = new CheckboxInput('STIX identifier', this._isSTIXId, true);
		toggle.setUpdate(() => {
			this._isSTIXId = toggle.submit();
			this.setDisplayedInput();
		});
		toggle.setContainer(toggleContainer);

		toggleLabel.addToContainer();
		toggle.addToContainer();

		labelHeader.appendChild(toggleContainer);

		this._globalDiv.appendChild(labelHeader);
		this.setInputs();
		this._container.appendChild(this._globalDiv);

		this.setDisplayedInput();
	}

	initIsStixID() {
		if (
			this._defaultValues == undefined ||
			this._playbookHandler.isAgentDefinition(this._defaultValues)
		) {
			this._isSTIXId = false;
		} else {
			this._isSTIXId = true;
		}
	}

	setInputs() {
		if (this._isSTIXId) {
			this._agent = new AgentInput(
				this._propertyName,
				{},
				this._playbookHandler,
				'agent-target',
				this._refreshFunction,
			);
			this._stixID = new TextFieldInput(this._propertyName, this._defaultValues);
		} else {
			this._agent = new AgentInput(
				this._propertyName,
				this._defaultValues,
				this._playbookHandler,
				'agent-target',
				this._refreshFunction,
			);
			this._stixID = new TextFieldInput(this._propertyName, undefined);
		}
		this._agent.setContainer(this._globalDiv);
		this._agent.addToContainer();

		this._stixID.setContainer(this._globalDiv);
		this._stixID.placeHolder = 'STIX 2.1 Identity, i.g. : identity--UUIDv4';
		this._stixID.addToContainer();
	}

	setDisplayedInput(): void {
		if (this._isSTIXId) {
			this._globalDiv.classList.add('property__executed__status--display__stix');
			this._globalDiv.classList.remove('property__executed__status--display__agent');
		} else {
			this._globalDiv.classList.add('property__executed__status--display__agent');
			this._globalDiv.classList.remove('property__executed__status--display__stix');
		}
	}

	setDefaultValues(defaultValues: string): void {
		this._defaultValues = defaultValues;
	}

	submit(): any {
		if (this._isSTIXId) {
			return this._stixID.submit();
		}
		return this._agent.submit();
	}
}
