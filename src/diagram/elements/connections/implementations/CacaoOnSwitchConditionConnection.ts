import type { Connection, ConnectionLike, Element } from 'diagram-js/lib/model/Types';
import type { KeyValue } from 'tiny-svg';
import type Canvas from 'diagram-js/lib/core/Canvas';
import CacaoBaseConnection, { CacaoConnectionType } from '../CacaoBaseConnection';
import CacaoFactory from '../../../modules/factory/CacaoFactory';
import type PlaybookHandler from '../../../modules/model/PlaybookHandler';
import type { SwitchConditionStep } from '../../../../../lib/cacao2-js/src/workflows/SwitchConditionStep';

export default class CacaoOnSwitchConditionConnection extends CacaoBaseConnection {
	constructor(connection: Connection | ConnectionLike | Element | undefined) {
		super(
			connection,
			CacaoConnectionType.ON_SWITCH_CONDITION,
			{
				attachers: 'b:l',
				className: 'on-condition',
				neighborConnectionAllowed: Object.values(CacaoConnectionType),
			},
			{ stroke: '#6504C1' },
		);
	}

	private getLabelText(playbookHandler: PlaybookHandler): string {
		const cacaoSource = CacaoFactory.getCacaoConstruct(this.source);
		const cacaoTarget = CacaoFactory.getCacaoConstruct(this.target);
		if (!cacaoSource || !cacaoTarget) {
			return '';
		}
		if (!cacaoSource.id || !cacaoTarget.id) {
			return 'NC switch';
		}
		const modelStep = playbookHandler.getStep(cacaoSource.id) as SwitchConditionStep;

		let temp = '';
		for (const key in modelStep.cases) {
			if (modelStep.cases[key] === cacaoTarget.id) {
				temp = key;
			}
		}
		return 'case: ' + temp;
	}

	override drawConnection(
		playbookHandler: PlaybookHandler,
		canvas: Canvas,
		visuals: SVGElement,
		connection: Connection,
	): SVGElement {
		let attrs: KeyValue;
		let elmt: SVGElement;

		attrs = this.getDrawingAttributs(canvas);
		elmt = this.drawLineConnection(visuals, connection, attrs);
		this.drawEmbeddedLabel(visuals, connection, this.getLabelText(playbookHandler), 'end');
		return elmt;
	}
}
