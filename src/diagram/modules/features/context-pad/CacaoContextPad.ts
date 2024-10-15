import type ContextPadProvider from 'diagram-js/lib/features/context-pad/ContextPadProvider';
import type ContextPad from 'diagram-js/lib/features/context-pad/ContextPad';
import type {
	ContextPadEntries,
	ContextPadTarget,
} from 'diagram-js/lib/features/context-pad/ContextPad';
import type CacaoBaseConnection from '../../../elements/connections/CacaoBaseConnection';
import { CacaoConnectionType } from '../../../elements/connections/CacaoBaseConnection';
import CacaoUtils from '../../core/CacaoUtils';
import type CacaoBaseConstruct from '../../../elements/constructs/CacaoBaseConstruct';
import { CacaoConstructType } from '../../../elements/constructs/CacaoBaseConstruct';
import type { Connection, Element, Shape, ShapeLike } from 'diagram-js/lib/model/Types';
import { assign } from 'min-dash';
import type ElementFactory from 'diagram-js/lib/core/ElementFactory';
import type Create from 'diagram-js/lib/features/create/Create';
import type CacaoModeling from '../modeling/CacaoModeling';
import type CacaoRules from '../rules/CacaoRules';
import type CacaoAutoPlace from '../auto-place/CacaoAutoPlace';
import CacaoFactory from '../../factory/CacaoFactory';
import type CacaoConnect from '../connect/CacaoConnect';
import { v4 as uuidv4 } from 'uuid';
import type EventBus from 'diagram-js/lib/core/EventBus';
import type PlaybookHandler from '../../model/PlaybookHandler';
import type { ContextPlaybookAttrs } from '../../model/PlaybookHandler';
import CacaoDialog from '../../core/CacaoDialog';
import type SelectionHandler from 'diagram-js/lib/features/selection/Selection';
import type CacaoSidePanel from '../side-panel/CacaoSidePanel';

/**
 * This class is a module
 * - module's entry points:
 *    - getContextPadEntries(..) & getMultiElementContextPadEntries(...)
 * - goal:
 *    - it provides entries for the contextual menu of a shape/connection
 */
export default class CacaoContextPad implements ContextPadProvider<Element> {
	_modeling: CacaoModeling;
	_elementFactory: ElementFactory;
	_create: Create;
	_cacaoAutoPlace: CacaoAutoPlace;
	_cacaoRules: CacaoRules;
	_cacaoConnect: CacaoConnect;
	_playbookHandler: PlaybookHandler;

	_currentTarget: undefined | ContextPadTarget<Element>;

	static $inject: string[];

	constructor(
		modeling: CacaoModeling,
		elementFactory: ElementFactory,
		create: Create,
		contextPad: ContextPad,
		cacaoAutoPlace: CacaoAutoPlace,
		cacaoRules: CacaoRules,
		cacaoConnect: CacaoConnect,
		eventBus: EventBus,
		playbookHandler: PlaybookHandler,
		selection: SelectionHandler,
		cacaoSidePanel: CacaoSidePanel,
	) {
		this._modeling = modeling;
		this._elementFactory = elementFactory;
		this._create = create;
		this._cacaoAutoPlace = cacaoAutoPlace;
		this._cacaoRules = cacaoRules;
		this._cacaoConnect = cacaoConnect;
		eventBus.on('playbook.changed', (context: ContextPlaybookAttrs) => {
			if (!context || !context.action || !context.element) {
				return;
			}
			if (context.action == 'add.shape') {
				if (!selection.isSelected(context.element)) {
					selection.select(context.element);
				}
			}
		});
		this._playbookHandler = playbookHandler;
		contextPad.registerProvider(this);
	}

	/**
	 * this method returns the entries of the context pad
	 * @param element
	 * @returns the contextpad entries
	 */
	getContextPadEntries(element: Element): any {
		let type: CacaoConstructType | CacaoConnectionType | undefined;
		const entries: ContextPadEntries = {};

		type = CacaoUtils.getTypeOfElement(element);
		if (!type) {
			//if not defined
			return entries;
		}

		if (CacaoUtils.isConnectionType(type)) {
			assign(entries, {
				...this.getRemoveEntry(),
				...this.getCacaoConnectionEntries(element),
			});
		}

		if (CacaoUtils.isConstructType(type)) {
			assign(entries, {
				...this.getRemoveEntry(),
			});
			assign(entries, {
				...this.getCacaoConstructEntries(element),
				...this.getConnectToolEntries(element),
			});
		}
		return entries;
	}

	getMultiElementContextPadEntries(elements: Element[]): any {
		let isConstruct = true;
		for (const element of elements) {
			if (
				!CacaoUtils.isConstructType(element?.type) &&
				!CacaoUtils.isConnectionType(element?.type)
			) {
				isConstruct = false;
			}
		}
		if (isConstruct) {
			return {
				...this.getRemoveEntries(),
			};
		}
		return {};
	}

	private getCacaoConstructEntry(cacaoConstruct: CacaoBaseConstruct, actionGroup = 'model'): any {
		const create: Create = this._create;
		const elementFactory: ElementFactory = this._elementFactory;
		const cacaoAutoPlace: CacaoAutoPlace = this._cacaoAutoPlace;
		const cacaoRules: CacaoRules = this._cacaoRules;

		function dragListener(event: any, element: ShapeLike) {
			var newShape = {
				id: cacaoConstruct.properties.modelType + '--' + uuidv4(),
				type: cacaoConstruct.type,
				x: event.clientX,
				y: event.clientY,
				width: cacaoConstruct.properties.width,
				height: cacaoConstruct.properties.height,
			};
			create.start(event, newShape, {
				source: element,
			});
		}

		function clickListener(event: any, element: Shape) {
			const newShape: any = {
				id: cacaoConstruct.properties.modelType + '--' + uuidv4(),
				type: cacaoConstruct.type,
				x: event.clientX,
				y: event.clientY,
				width: cacaoConstruct.properties.width,
				height: cacaoConstruct.properties.height,
			};
			const connectionType = cacaoRules.canConnectToShapeType(element, cacaoConstruct.type);
			if (connectionType) {
				const connection: Partial<Connection> = { type: connectionType };
				cacaoAutoPlace.appendShape(element, newShape, connection);
			}
		}

		return {
			group: actionGroup,
			className: cacaoConstruct.properties.className,
			title: cacaoConstruct.properties.title,
			action: {
				dragstart: dragListener,
				click: clickListener,
			},
		};
	}

	private getCacaoConstructEntries(element: Element) {
		const entries: ContextPadEntries = {};

		for (const type of Object.values(CacaoConstructType)) {
			const cacaoConstruct = CacaoFactory.getCacaoConstruct(undefined, type);
			if (!cacaoConstruct) {
				continue;
			}
			const connectionType = this._cacaoRules.canConnectToShapeType(element, type);
			if (connectionType) {
				const key = `create.${type}`;
				entries[key] = this.getCacaoConstructEntry(cacaoConstruct);
			}
		}
		return entries;
	}

	private getCacaoConnectionEntry(
		cacaoConnection: CacaoBaseConnection,
		actionGroup = 'model',
	): any {
		const modeling = this._modeling;

		function clickListener(event: any, element: Connection) {
			modeling.updateConnectionType(element, cacaoConnection.type);
		}

		return {
			group: actionGroup,
			className: cacaoConnection.properties.className,
			title: cacaoConnection.type,
			action: {
				click: clickListener,
			},
		};
	}

	private getCacaoConnectionEntries(element: Element) {
		const entries: ContextPadEntries = {};

		const cacaoConnection = CacaoFactory.getCacaoConnection(element);

		if (!cacaoConnection) {
			// If not a cacao connection
			return entries;
		}

		const source = cacaoConnection.source;
		const target = cacaoConnection.target;

		if (!source || !target) {
			// If source/target not defined
			return entries;
		}

		for (const type of Object.values(CacaoConnectionType)) {
			const cacaoConnectionEntry = CacaoFactory.getCacaoConnection(undefined, type);
			if (
				cacaoConnectionEntry &&
				this._cacaoRules.canChangeConnectionType(source, target, cacaoConnection.type, type)
			) {
				const key = `create.${type}`;
				entries[key] = this.getCacaoConnectionEntry(cacaoConnectionEntry);
			}
		}
		return entries;
	}

	private getConnectToolEntry(cacaoConnection: CacaoBaseConnection): any {
		const self = this;
		function connectHandler(event: any, element: Element) {
			self._cacaoConnect.start(event, element, cacaoConnection.type);
		}
		return {
			group: 'tools',
			className: cacaoConnection.properties.className,
			title: cacaoConnection.type,
			action: {
				dragstart: connectHandler,
				click: connectHandler,
			},
		};
	}

	/**
	 * Return the entries for all the connection type available
	 * @param element
	 * @returns
	 */
	private getConnectToolEntries(element: Element) {
		const entries: ContextPadEntries = {};

		const cacaoConstruct = CacaoFactory.getCacaoConstruct(element);

		if (!cacaoConstruct) {
			// If not a cacao construct
			return entries;
		}

		for (const type of Object.values(CacaoConnectionType)) {
			const cacaoConnectionEntry = CacaoFactory.getCacaoConnection(undefined, type);
			if (cacaoConnectionEntry && this._cacaoRules.canStartConnect(element, type)) {
				const key = `connect.${type}`;
				entries[key] = this.getConnectToolEntry(cacaoConnectionEntry);
			}
		}
		return entries;
	}

	private getRemoveEntry() {
		const removeHandler = async (e: any, element: Element) => {
			if (CacaoUtils.isConstructType(element.type)) {
				if (
					Object.keys(
						CacaoUtils.filterEmptyValues(this._playbookHandler.getStep(element.id)),
					).length > 2
				) {
					if (
						!(await CacaoDialog.showConfirm(
							'Are you sure you want to remove this step?',
							'You will not be able to undo this action.',
						))
					) {
						return;
					}
				}
			}
			this._modeling.removeElements([element]);
		};
		return {
			remover: {
				group: 'tool',
				className: 'bin',
				title: 'remove',
				action: {
					click: removeHandler,
				},
			},
		};
	}

	private getRemoveEntries() {
		const removeHandler = async (e: any, elements: Element[]) => {
			if (
				!(await CacaoDialog.showConfirm(
					'Are you sure you want to remove this step?',
					'You will not be able to undo this action.',
				))
			) {
				return;
			}
			for (const element of elements) {
				if (
					!CacaoUtils.isConstructType(element.type) &&
					!CacaoUtils.isConnectionType(element.type)
				) {
					return;
				}
			}
			elements = elements.sort((a: Element, b: Element) =>
				CacaoUtils.isConnectionType(a.type) ? -1 : 1,
			);
			this._modeling.removeElements(elements.slice());
		};
		return {
			remover: {
				group: 'tool',
				className: 'bin',
				title: 'remove',
				action: {
					click: removeHandler,
				},
			},
		};
	}
}

CacaoContextPad.$inject = [
	'modeling',
	'elementFactory',
	'create',
	'contextPad',
	'cacaoAutoPlace',
	'cacaoRules',
	'cacaoConnect',
	'eventBus',
	'playbookHandler',
	'selection',
	'cacaoSidePanel',
];
