import type { Shape, Element } from 'diagram-js/lib/model/Types';
import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { isNil, isObject } from 'min-dash';
import type EventBus from 'diagram-js/lib/core/EventBus';
import type Rules from 'diagram-js/lib/features/rules/Rules';
import type Dragging from 'diagram-js/lib/features/dragging/Dragging';
import type CacaoModeling from '../modeling/CacaoModeling';
import type { CacaoConnectionType } from '../../../elements/connections/CacaoBaseConnection';

export default class CacaoConnect {
	_eventBus: EventBus;
	_dragging: Dragging;
	_modeling: CacaoModeling;
	_rules: Rules;

	static $inject: string[];

	constructor(eventBus: EventBus, dragging: Dragging, modeling: CacaoModeling, rules: Rules) {
		this._eventBus = eventBus;
		this._dragging = dragging;
		this._modeling = modeling;
		this._rules = rules;
		this.bindEvents();
	}

	/**
	 * this method start the creation of the connection
	 * @param event the dragEvent
	 * @param start the source element of the connection
	 * @param type  the type of the new connection
	 */
	start(event: DragEvent, start: Element, type: CacaoConnectionType) {
		this._dragging.init(event, 'cacaoConnect', {
			autoActivate: false,
			data: {
				shape: start,
				context: {
					start: start,
					connectionStart: getMid(start),
					connectionType: type,
				},
			},
		});
	}

	private bindEvents() {
		this._eventBus.on('cacaoConnect.hover', (event: any) => {
			const context = event.context;
			const start = context.start;
			const hover = event.hover;
			const connectionType = context.connectionType;
			let canExecute: any;

			// Cache hover state
			context.hover = hover;
			canExecute = context.canExecute = this.canConnect(start, hover, connectionType);

			// Ignore hover
			if (isNil(canExecute)) {
				return;
			}

			if (canExecute) {
				canExecute = context.canExecute = { type: context.connectionType };
			}

			if (canExecute !== false) {
				context.source = start;
				context.target = hover;

				return;
			}
		});

		this._eventBus.on(['cacaoConnect.out', 'cacaoConnect.cleanup'], 1000, (event: any) => {
			const context = event.context;

			context.hover = null;
			context.source = null;
			context.target = null;
			context.canExecute = false;
		});

		this._eventBus.on('cacaoConnect.end', 1000, (event: any) => {
			var context = event.context,
				canExecute = context.canExecute,
				connectionStart = context.connectionStart,
				connectionEnd = {
					x: event.x,
					y: event.y,
				},
				source = context.source,
				target = context.target;

			if (!canExecute) {
				return false;
			}

			var attrs = null,
				hints = {
					connectionStart: connectionStart,
					connectionEnd: connectionEnd,
				};

			if (isObject(canExecute)) {
				attrs = canExecute;
			}

			context.connection = this._modeling.connect(source, target, attrs, hints);
		});
	}

	/**
	 * this method return a boolean to know if we can connect the two shapes using the connectionType provided
	 *  It calls the rule provider
	 * @param source
	 * @param target
	 * @param connectionType
	 * @returns boolean: True if the connection follow the rules, False otherwise
	 */
	private canConnect(source: Shape, target: Shape, connectionType: CacaoConnectionType): boolean {
		return (
			this._rules.allowed('connection.create', {
				source: source,
				target: target,
				type: connectionType,
			}) ?? false
		);
	}
}

CacaoConnect.$inject = ['eventBus', 'dragging', 'modeling', 'rules'];
