import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
    AfterContentInit,
    AfterViewInit,
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    ContentChildren,
    ElementRef,
    EventEmitter,
    forwardRef,
    inject,
    Input,
    NgModule,
    NgZone,
    numberAttribute,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { absolutePosition, addClass, addStyle, appendChild, find, findSingle, getFocusableElements, getIndex, getOuterWidth, hasClass, isDate, isNotEmpty, isTouchDevice, relativePosition, setAttribute, uuid } from '@primeuix/utils';
import { OverlayService, PrimeTemplate, SharedModule, TranslationKeys } from 'primeng/api';
import { AutoFocus } from 'primeng/autofocus';
import { BaseComponent } from 'primeng/basecomponent';
import { Button } from 'primeng/button';
import { ConnectedOverlayScrollHandler, unblockBodyScroll, blockBodyScroll } from 'primeng/dom';
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, TimesIcon } from 'primeng/icons';
import { InputText } from 'primeng/inputtext';
import { Ripple } from 'primeng/ripple';
import { Nullable, VoidListener } from 'primeng/ts-helpers';
import { ZIndexUtils } from 'primeng/utils';
import { Subscription } from 'rxjs';
import { DatePickerMonthChangeEvent, DatePickerResponsiveOptions, DatePickerTypeView, DatePickerYearChangeEvent, LocaleSettings, Month, NavigationState } from './datepicker.interface';
import { DatePickerStyle } from './style/datepickerstyle';
import { BaseInput } from 'primeng/baseinput';

export const DATEPICKER_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatePicker),
    multi: true
};
/**
 * DatePicker is a form component to work with dates.
 * @group Components
 */
@Component({
    selector: 'p-datePicker, p-datepicker, p-date-picker',
    standalone: true,
    imports: [CommonModule, Button, Ripple, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, TimesIcon, CalendarIcon, AutoFocus, InputText, SharedModule],
    template: `
        <ng-template [ngIf]="!inline">
            <input
                #inputfield
                pInputText
                [pSize]="size()"
                type="text"
                role="combobox"
                [attr.id]="inputId"
                [attr.name]="name()"
                [attr.required]="required()"
                [attr.aria-required]="required()"
                aria-autocomplete="none"
                aria-haspopup="dialog"
                [attr.aria-expanded]="overlayVisible ?? false"
                [attr.aria-controls]="overlayVisible ? panelId : null"
                [attr.aria-labelledby]="ariaLabelledBy"
                [attr.aria-label]="ariaLabel"
                [value]="inputFieldValue"
                (focus)="onInputFocus($event)"
                (keydown)="onInputKeydown($event)"
                (click)="onInputClick()"
                (blur)="onInputBlur($event)"
                [readonly]="readonlyInput"
                (input)="onUserInput($event)"
                [ngStyle]="inputStyle"
                [class]="cn(cx('pcInputText'), inputStyleClass)"
                [placeholder]="placeholder || ''"
                [disabled]="disabled()"
                [attr.tabindex]="tabindex"
                [attr.inputmode]="touchUI ? 'off' : null"
                autocomplete="off"
                [pAutoFocus]="autofocus"
                [variant]="$variant()"
                [fluid]="hasFluid"
                [invalid]="invalid()"
            />
            <ng-container *ngIf="showClear && !disabled() && value != null">
                <TimesIcon *ngIf="!clearIconTemplate && !_clearIconTemplate" [class]="cx('clearIcon')" (click)="clear()" />
                <span *ngIf="clearIconTemplate || _clearIconTemplate" [class]="cx('clearIcon')" (click)="clear()">
                    <ng-template *ngTemplateOutlet="clearIconTemplate || _clearIconTemplate"></ng-template>
                </span>
            </ng-container>
            <button
                type="button"
                [attr.aria-label]="iconButtonAriaLabel"
                aria-haspopup="dialog"
                [attr.aria-expanded]="overlayVisible ?? false"
                [attr.aria-controls]="overlayVisible ? panelId : null"
                *ngIf="showIcon && iconDisplay === 'button'"
                (click)="onButtonClick($event, inputfield)"
                [class]="cx('dropdown')"
                [disabled]="disabled()"
                tabindex="0"
            >
                <span *ngIf="icon" [ngClass]="icon"></span>
                <ng-container *ngIf="!icon">
                    <CalendarIcon *ngIf="!triggerIconTemplate && !_triggerIconTemplate" />
                    <ng-template *ngTemplateOutlet="triggerIconTemplate || _triggerIconTemplate"></ng-template>
                </ng-container>
            </button>
            <ng-container *ngIf="iconDisplay === 'input' && showIcon">
                <span [class]="cx('inputIconContainer')">
                    <CalendarIcon (click)="onButtonClick($event)" *ngIf="!inputIconTemplate && !_inputIconTemplate" [class]="cx('inputIcon')" />

                    <ng-container *ngTemplateOutlet="inputIconTemplate || _inputIconTemplate; context: { clickCallBack: onButtonClick.bind(this) }"></ng-container>
                </span>
            </ng-container>
        </ng-template>
        <div
            #contentWrapper
            [attr.id]="panelId"
            [ngStyle]="panelStyle"
            [class]="cn(cx('panel'), panelStyleClass)"
            [@overlayAnimation]="{
                value: 'visible',
                params: { showTransitionParams: showTransitionOptions, hideTransitionParams: hideTransitionOptions }
            }"
            [attr.aria-label]="getTranslation('chooseDate')"
            [attr.role]="inline ? null : 'dialog'"
            [attr.aria-modal]="inline ? null : 'true'"
            [@.disabled]="inline === true"
            (@overlayAnimation.start)="onOverlayAnimationStart($event)"
            (@overlayAnimation.done)="onOverlayAnimationDone($event)"
            (click)="onOverlayClick($event)"
            *ngIf="inline || overlayVisible"
        >
            <ng-content select="p-header"></ng-content>
            <ng-container *ngTemplateOutlet="headerTemplate || _headerTemplate"></ng-container>
            <ng-container *ngIf="!timeOnly">
                <div [class]="cx('calendarContainer')">
                    <div [class]="cx('calendar')" *ngFor="let month of months; let i = index">
                        <div [class]="cx('header')">
                            <p-button
                                size="small"
                                rounded
                                text
                                (keydown)="onContainerButtonKeydown($event)"
                                [styleClass]="cx('pcPrevButton')"
                                (onClick)="onPrevButtonClick($event)"
                                [ngStyle]="{ visibility: i === 0 ? 'visible' : 'hidden' }"
                                type="button"
                                [ariaLabel]="prevIconAriaLabel"
                            >
                                <ChevronLeftIcon *ngIf="!previousIconTemplate && !_previousIconTemplate" />
                                <span *ngIf="previousIconTemplate || _previousIconTemplate">
                                    <ng-template *ngTemplateOutlet="previousIconTemplate || _previousIconTemplate"></ng-template>
                                </span>
                            </p-button>
                            <div [class]="cx('title')">
                                <button
                                    *ngIf="currentView === 'date'"
                                    type="button"
                                    (click)="switchToMonthView($event)"
                                    (keydown)="onContainerButtonKeydown($event)"
                                    [class]="cx('selectMonth')"
                                    [disabled]="switchViewButtonDisabled()"
                                    [attr.aria-label]="this.getTranslation('chooseMonth')"
                                    pRipple
                                >
                                    {{ getMonthName(month.month) }}
                                </button>
                                <button
                                    *ngIf="currentView !== 'year'"
                                    type="button"
                                    (click)="switchToYearView($event)"
                                    (keydown)="onContainerButtonKeydown($event)"
                                    [class]="cx('selectYear')"
                                    [disabled]="switchViewButtonDisabled()"
                                    [attr.aria-label]="getTranslation('chooseYear')"
                                    pRipple
                                >
                                    {{ getYear(month) }}
                                </button>
                                <span [class]="cx('decade')" *ngIf="currentView === 'year'">
                                    <ng-container *ngIf="!decadeTemplate && !_decadeTemplate">{{ yearPickerValues()[0] }} - {{ yearPickerValues()[yearPickerValues().length - 1] }}</ng-container>
                                    <ng-container *ngTemplateOutlet="decadeTemplate || _decadeTemplate; context: { $implicit: yearPickerValues }"></ng-container>
                                </span>
                            </div>
                            <p-button
                                rounded
                                text
                                size="small"
                                (keydown)="onContainerButtonKeydown($event)"
                                [styleClass]="cx('pcNextButton')"
                                (onClick)="onNextButtonClick($event)"
                                [ngStyle]="{ visibility: i === months.length - 1 ? 'visible' : 'hidden' }"
                                [ariaLabel]="nextIconAriaLabel"
                            >
                                <ChevronRightIcon *ngIf="!nextIconTemplate && !_nextIconTemplate" />

                                <span *ngIf="nextIconTemplate || _nextIconTemplate">
                                    <ng-template *ngTemplateOutlet="nextIconTemplate || _nextIconTemplate"></ng-template>
                                </span>
                            </p-button>
                        </div>
                        <table [class]="cx('dayView')" role="grid" *ngIf="currentView === 'date'">
                            <thead>
                                <tr>
                                    <th *ngIf="showWeek" [class]="cx('weekHeader')">
                                        <span>{{ getTranslation('weekHeader') }}</span>
                                    </th>
                                    <th [class]="cx('weekDayCell')" scope="col" *ngFor="let weekDay of weekDays; let begin = first; let end = last">
                                        <span [class]="cx('weekDay')">{{ weekDay }}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let week of month.dates; let j = index">
                                    <td *ngIf="showWeek" [class]="cx('weekNumber')">
                                        <span [class]="cx('weekLabelContainer')">
                                            {{ month.weekNumbers[j] }}
                                        </span>
                                    </td>
                                    <td *ngFor="let date of week" [attr.aria-label]="date.day" [class]="cx('dayCell', { date })">
                                        <ng-container *ngIf="date.otherMonth ? showOtherMonths : true">
                                            <span [ngClass]="dayClass(date)" (click)="onDateSelect($event, date)" draggable="false" [attr.data-date]="formatDateKey(formatDateMetaToDate(date))" (keydown)="onDateCellKeydown($event, date, i)" pRipple>
                                                <ng-container *ngIf="!dateTemplate && !_dateTemplate && (date.selectable || (!disabledDateTemplate && !_disabledDateTemplate))">{{ date.day }}</ng-container>
                                                <ng-container *ngIf="date.selectable || (!disabledDateTemplate && !_disabledDateTemplate)">
                                                    <ng-container *ngTemplateOutlet="dateTemplate || _dateTemplate; context: { $implicit: date }"></ng-container>
                                                </ng-container>
                                                <ng-container *ngIf="!date.selectable">
                                                    <ng-container *ngTemplateOutlet="disabledDateTemplate || _disabledDateTemplate; context: { $implicit: date }"></ng-container>
                                                </ng-container>
                                            </span>
                                            <div *ngIf="isSelected(date)" class="p-hidden-accessible" aria-live="polite">
                                                {{ date.day }}
                                            </div>
                                        </ng-container>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div [class]="cx('monthView')" *ngIf="currentView === 'month'">
                    <span *ngFor="let m of monthPickerValues(); let i = index" (click)="onMonthSelect($event, i)" (keydown)="onMonthCellKeydown($event, i)" [class]="cx('month', { month: m, index: i })" pRipple>
                        {{ m }}
                        <div *ngIf="isMonthSelected(i)" class="p-hidden-accessible" aria-live="polite">
                            {{ m }}
                        </div>
                    </span>
                </div>
                <div [class]="cx('yearView')" *ngIf="currentView === 'year'">
                    <span *ngFor="let y of yearPickerValues()" (click)="onYearSelect($event, y)" (keydown)="onYearCellKeydown($event, y)" [class]="cx('year', { year: y })" pRipple>
                        {{ y }}
                        <div *ngIf="isYearSelected(y)" class="p-hidden-accessible" aria-live="polite">
                            {{ y }}
                        </div>
                    </span>
                </div>
            </ng-container>
            <div [class]="cx('timePicker')" *ngIf="(showTime || timeOnly) && currentView === 'date'">
                <div [class]="cx('hourPicker')">
                    <p-button
                        rounded
                        text
                        size="small"
                        [styleClass]="cx('pcIncrementButton')"
                        (keydown)="onContainerButtonKeydown($event)"
                        (keydown.enter)="incrementHour($event)"
                        (keydown.space)="incrementHour($event)"
                        (mousedown)="onTimePickerElementMouseDown($event, 0, 1)"
                        (mouseup)="onTimePickerElementMouseUp($event)"
                        (keyup.enter)="onTimePickerElementMouseUp($event)"
                        (keyup.space)="onTimePickerElementMouseUp($event)"
                        (mouseleave)="onTimePickerElementMouseLeave()"
                        [attr.aria-label]="getTranslation('nextHour')"
                    >
                        <ChevronUpIcon *ngIf="!incrementIconTemplate && !_incrementIconTemplate" />

                        <ng-template *ngTemplateOutlet="incrementIconTemplate || _incrementIconTemplate"></ng-template>
                    </p-button>
                    <span><ng-container *ngIf="currentHour < 10">0</ng-container>{{ currentHour }}</span>
                    <p-button
                        rounded
                        text
                        size="small"
                        [styleClass]="cx('pcDecrementButton')"
                        (keydown)="onContainerButtonKeydown($event)"
                        (keydown.enter)="decrementHour($event)"
                        (keydown.space)="decrementHour($event)"
                        (mousedown)="onTimePickerElementMouseDown($event, 0, -1)"
                        (mouseup)="onTimePickerElementMouseUp($event)"
                        (keyup.enter)="onTimePickerElementMouseUp($event)"
                        (keyup.space)="onTimePickerElementMouseUp($event)"
                        (mouseleave)="onTimePickerElementMouseLeave()"
                        [attr.aria-label]="getTranslation('prevHour')"
                    >
                        <ChevronDownIcon *ngIf="!decrementIconTemplate && !_decrementIconTemplate" />

                        <ng-template *ngTemplateOutlet="decrementIconTemplate || _decrementIconTemplate"></ng-template>
                    </p-button>
                </div>
                <div class="p-datepicker-separator">
                    <span>{{ timeSeparator }}</span>
                </div>
                <div [class]="cx('minutePicker')">
                    <p-button
                        rounded
                        text
                        size="small"
                        [styleClass]="cx('pcIncrementButton')"
                        (keydown)="onContainerButtonKeydown($event)"
                        (keydown.enter)="incrementMinute($event)"
                        (keydown.space)="incrementMinute($event)"
                        (mousedown)="onTimePickerElementMouseDown($event, 1, 1)"
                        (mouseup)="onTimePickerElementMouseUp($event)"
                        (keyup.enter)="onTimePickerElementMouseUp($event)"
                        (keyup.space)="onTimePickerElementMouseUp($event)"
                        (mouseleave)="onTimePickerElementMouseLeave()"
                        [attr.aria-label]="getTranslation('nextMinute')"
                    >
                        <ChevronUpIcon *ngIf="!incrementIconTemplate && !_incrementIconTemplate" />

                        <ng-template *ngTemplateOutlet="incrementIconTemplate || _incrementIconTemplate"></ng-template>
                    </p-button>
                    <span><ng-container *ngIf="currentMinute < 10">0</ng-container>{{ currentMinute }}</span>
                    <p-button
                        rounded
                        text
                        size="small"
                        [styleClass]="cx('pcDecrementButton')"
                        (keydown)="onContainerButtonKeydown($event)"
                        (keydown.enter)="decrementMinute($event)"
                        (keydown.space)="decrementMinute($event)"
                        (mousedown)="onTimePickerElementMouseDown($event, 1, -1)"
                        (mouseup)="onTimePickerElementMouseUp($event)"
                        (keyup.enter)="onTimePickerElementMouseUp($event)"
                        (keyup.space)="onTimePickerElementMouseUp($event)"
                        (mouseleave)="onTimePickerElementMouseLeave()"
                        [attr.aria-label]="getTranslation('prevMinute')"
                    >
                        <ChevronDownIcon *ngIf="!decrementIconTemplate && !_decrementIconTemplate" />
                        <ng-container *ngIf="decrementIconTemplate || _decrementIconTemplate">
                            <ng-template *ngTemplateOutlet="decrementIconTemplate || _decrementIconTemplate"></ng-template>
                        </ng-container>
                    </p-button>
                </div>
                <div [class]="cx('separator')" *ngIf="showSeconds">
                    <span>{{ timeSeparator }}</span>
                </div>
                <div [class]="cx('secondPicker')" *ngIf="showSeconds">
                    <p-button
                        rounded
                        text
                        size="small"
                        [styleClass]="cx('pcIncrementButton')"
                        (keydown)="onContainerButtonKeydown($event)"
                        (keydown.enter)="incrementSecond($event)"
                        (keydown.space)="incrementSecond($event)"
                        (mousedown)="onTimePickerElementMouseDown($event, 2, 1)"
                        (mouseup)="onTimePickerElementMouseUp($event)"
                        (keyup.enter)="onTimePickerElementMouseUp($event)"
                        (keyup.space)="onTimePickerElementMouseUp($event)"
                        (mouseleave)="onTimePickerElementMouseLeave()"
                        [attr.aria-label]="getTranslation('nextSecond')"
                    >
                        <ChevronUpIcon *ngIf="!incrementIconTemplate && !_incrementIconTemplate" />

                        <ng-template *ngTemplateOutlet="incrementIconTemplate || _incrementIconTemplate"></ng-template>
                    </p-button>
                    <span><ng-container *ngIf="currentSecond < 10">0</ng-container>{{ currentSecond }}</span>
                    <p-button
                        rounded
                        text
                        size="small"
                        [styleClass]="cx('pcDecrementButton')"
                        (keydown)="onContainerButtonKeydown($event)"
                        (keydown.enter)="decrementSecond($event)"
                        (keydown.space)="decrementSecond($event)"
                        (mousedown)="onTimePickerElementMouseDown($event, 2, -1)"
                        (mouseup)="onTimePickerElementMouseUp($event)"
                        (keyup.enter)="onTimePickerElementMouseUp($event)"
                        (keyup.space)="onTimePickerElementMouseUp($event)"
                        (mouseleave)="onTimePickerElementMouseLeave()"
                        [attr.aria-label]="getTranslation('prevSecond')"
                    >
                        <ChevronDownIcon *ngIf="!decrementIconTemplate && !_decrementIconTemplate" />

                        <ng-template *ngTemplateOutlet="decrementIconTemplate || _decrementIconTemplate"></ng-template>
                    </p-button>
                </div>
                <div [class]="cx('separator')" *ngIf="hourFormat == '12'">
                    <span>{{ timeSeparator }}</span>
                </div>
                <div [class]="cx('ampmPicker')" *ngIf="hourFormat == '12'">
                    <p-button size="small" text rounded [styleClass]="cx('pcIncrementButton')" (keydown)="onContainerButtonKeydown($event)" (onClick)="toggleAMPM($event)" (keydown.enter)="toggleAMPM($event)" [attr.aria-label]="getTranslation('am')">
                        <ChevronUpIcon *ngIf="!incrementIconTemplate && !_incrementIconTemplate" />
                        <ng-template *ngTemplateOutlet="incrementIconTemplate || _incrementIconTemplate"></ng-template>
                    </p-button>
                    <span>{{ pm ? 'PM' : 'AM' }}</span>
                    <p-button size="small" text rounded [styleClass]="cx('pcDecrementButton')" (keydown)="onContainerButtonKeydown($event)" (click)="toggleAMPM($event)" (keydown.enter)="toggleAMPM($event)" [attr.aria-label]="getTranslation('pm')">
                        <ChevronDownIcon *ngIf="!decrementIconTemplate && !_decrementIconTemplate" />
                        <ng-template *ngTemplateOutlet="decrementIconTemplate || _decrementIconTemplate"></ng-template>
                    </p-button>
                </div>
            </div>
            <div [class]="cx('buttonbar')" *ngIf="showButtonBar">
                <p-button size="small" [styleClass]="cx('pcTodayButton')" [label]="getTranslation('today')" (keydown)="onContainerButtonKeydown($event)" (onClick)="onTodayButtonClick($event)" [ngClass]="todayButtonStyleClass" />
                <p-button size="small" [styleClass]="cx('pcClearButton')" [label]="getTranslation('clear')" (keydown)="onContainerButtonKeydown($event)" (onClick)="onClearButtonClick($event)" [ngClass]="clearButtonStyleClass" />
            </div>
            <ng-content select="p-footer"></ng-content>
            <ng-container *ngTemplateOutlet="footerTemplate || _footerTemplate"></ng-container>
        </div>
    `,
    animations: [
        trigger('overlayAnimation', [
            state(
                'visibleTouchUI',
                style({
                    transform: 'translate(-50%,-50%)',
                    opacity: 1
                })
            ),
            transition('void => visible', [style({ opacity: 0, transform: 'scaleY(0.8)' }), animate('{{showTransitionParams}}', style({ opacity: 1, transform: '*' }))]),
            transition('visible => void', [animate('{{hideTransitionParams}}', style({ opacity: 0 }))]),
            transition('void => visibleTouchUI', [style({ opacity: 0, transform: 'translate3d(-50%, -40%, 0) scale(0.9)' }), animate('{{showTransitionParams}}')]),
            transition('visibleTouchUI => void', [
                animate(
                    '{{hideTransitionParams}}',
                    style({
                        opacity: 0,
                        transform: 'translate3d(-50%, -40%, 0) scale(0.9)'
                    })
                )
            ])
        ])
    ],
    providers: [DATEPICKER_VALUE_ACCESSOR, DatePickerStyle],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    host: {
        '[class]': "cn(cx('root'), styleClass)",
        '[style]': "sx('root')"
    }
})
export class DatePicker extends BaseInput implements OnInit, AfterContentInit, AfterViewInit, OnDestroy, ControlValueAccessor {
    @Input() iconDisplay: 'input' | 'button' = 'button';
    /**
     * Style class of the component.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Inline style of the input field.
     * @group Props
     */
    @Input() inputStyle: { [klass: string]: any } | null | undefined;
    /**
     * Identifier of the focus input to match a label defined for the component.
     * @group Props
     */
    @Input() inputId: string | undefined;
    /**
     * Style class of the input field.
     * @group Props
     */
    @Input() inputStyleClass: string | undefined;
    /**
     * Placeholder text for the input.
     * @group Props
     */
    @Input() placeholder: string | undefined;
    /**
     * Establishes relationships between the component and label(s) where its value should be one or more element IDs.
     * @group Props
     */
    @Input() ariaLabelledBy: string | undefined;
    /**
     * Defines a string that labels the input for accessibility.
     * @group Props
     */
    @Input() ariaLabel: string | undefined;

    /**
     * Defines a string that labels the icon button for accessibility.
     * @group Props
     */
    @Input() iconAriaLabel: string | undefined;
    /**
     * Format of the date which can also be defined at locale settings.
     * @group Props
     */
    @Input()
    get dateFormat(): string | undefined {
        return this._dateFormat;
    }
    set dateFormat(value: string | undefined) {
        this._dateFormat = value;
        if (this.initialized) {
            this.updateInputfield();
        }
    }
    /**
     * Separator for multiple selection mode.
     * @group Props
     */
    @Input() multipleSeparator: string = ',';
    /**
     * Separator for joining start and end dates on range selection mode.
     * @group Props
     */
    @Input() rangeSeparator: string = '-';
    /**
     * When enabled, displays the datepicker as inline. Default is false for popup mode.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) inline: boolean = false;
    /**
     * Whether to display dates in other months (non-selectable) at the start or end of the current month. To make these days selectable use the selectOtherMonths option.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showOtherMonths: boolean = true;
    /**
     * Whether days in other months shown before or after the current month are selectable. This only applies if the showOtherMonths option is set to true.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) selectOtherMonths: boolean | undefined;
    /**
     * When enabled, displays a button with icon next to input.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showIcon: boolean | undefined;
    /**
     * Icon of the datepicker button.
     * @group Props
     */
    @Input() icon: string | undefined;
    /**
     * Target element to attach the overlay, valid values are "body" or a local ng-template variable of another element (note: use binding with brackets for template variables, e.g. [appendTo]="mydiv" for a div element having#mydiv as variable name).
     * @group Props
     */
    @Input() appendTo: HTMLElement | ElementRef | TemplateRef<any> | string | null | undefined | any;
    /**
     * When specified, prevents entering the date manually with keyboard.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) readonlyInput: boolean | undefined;
    /**
     * The cutoff year for determining the century for a date.
     * @group Props
     */
    @Input() shortYearCutoff: any = '+10';
    /**
     * Whether the month should be rendered as a dropdown instead of text.
     * @group Props
     * @deprecated Navigator is always on.
     */
    @Input({ transform: booleanAttribute }) monthNavigator: boolean | undefined;
    /**
     * Whether the year should be rendered as a dropdown instead of text.
     * @group Props
     * @deprecated  Navigator is always on.
     */
    @Input({ transform: booleanAttribute }) yearNavigator: boolean | undefined;
    /**
     * Specifies 12 or 24 hour format.
     * @group Props
     */
    @Input()
    get hourFormat(): string {
        return this._hourFormat;
    }
    set hourFormat(value: string) {
        this._hourFormat = value;
        if (this.initialized) {
            this.updateInputfield();
        }
    }
    /**
     * Whether to display timepicker only.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) timeOnly: boolean | undefined;
    /**
     * Hours to change per step.
     * @group Props
     */
    @Input({ transform: numberAttribute }) stepHour: number = 1;
    /**
     * Minutes to change per step.
     * @group Props
     */
    @Input({ transform: numberAttribute }) stepMinute: number = 1;
    /**
     * Seconds to change per step.
     * @group Props
     */
    @Input({ transform: numberAttribute }) stepSecond: number = 1;
    /**
     * Whether to show the seconds in time picker.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showSeconds: boolean = false;
    /**
     * When disabled, datepicker will not be visible with input focus.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showOnFocus: boolean = true;
    /**
     * When enabled, datepicker will show week numbers.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showWeek: boolean = false;
    /**
     * When enabled, datepicker will start week numbers from first day of the year.
     * @group Props
     */
    @Input() startWeekFromFirstDayOfYear: boolean = false;
    /**
     * When enabled, a clear icon is displayed to clear the value.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showClear: boolean = false;
    /**
     * Type of the value to write back to ngModel, default is date and alternative is string.
     * @group Props
     */
    @Input() dataType: string = 'date';
    /**
     * Defines the quantity of the selection, valid values are "single", "multiple" and "range".
     * @group Props
     */
    @Input() selectionMode: 'single' | 'multiple' | 'range' | undefined = 'single';
    /**
     * Maximum number of selectable dates in multiple mode.
     * @group Props
     */
    @Input({ transform: numberAttribute }) maxDateCount: number | undefined;
    /**
     * Whether to display today and clear buttons at the footer
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showButtonBar: boolean | undefined;
    /**
     * Style class of the today button.
     * @group Props
     */
    @Input() todayButtonStyleClass: string | undefined;
    /**
     * Style class of the clear button.
     * @group Props
     */
    @Input() clearButtonStyleClass: string | undefined;
    /**
     * When present, it specifies that the component should automatically get focus on load.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autofocus: boolean | undefined;
    /**
     * Whether to automatically manage layering.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autoZIndex: boolean = true;
    /**
     * Base zIndex value to use in layering.
     * @group Props
     */
    @Input({ transform: numberAttribute }) baseZIndex: number = 0;
    /**
     * Style class of the datetimepicker container element.
     * @group Props
     */
    @Input() panelStyleClass: string | undefined;
    /**
     * Inline style of the datetimepicker container element.
     * @group Props
     */
    @Input() panelStyle: any;
    /**
     * Keep invalid value when input blur.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) keepInvalid: boolean = false;
    /**
     * Whether to hide the overlay on date selection.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) hideOnDateTimeSelect: boolean = true;
    /**
     * When enabled, datepicker overlay is displayed as optimized for touch devices.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) touchUI: boolean | undefined;
    /**
     * Separator of time selector.
     * @group Props
     */
    @Input() timeSeparator: string = ':';
    /**
     * When enabled, can only focus on elements inside the datepicker.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) focusTrap: boolean = true;
    /**
     * Transition options of the show animation.
     * @group Props
     */
    @Input() showTransitionOptions: string = '.12s cubic-bezier(0, 0, 0.2, 1)';
    /**
     * Transition options of the hide animation.
     * @group Props
     */
    @Input() hideTransitionOptions: string = '.1s linear';
    /**
     * Index of the element in tabbing order.
     * @group Props
     */
    @Input({ transform: numberAttribute }) tabindex: number | undefined;
    /**
     * The minimum selectable date.
     * @group Props
     */
    @Input() get minDate(): Date | undefined | null {
        return this._minDate;
    }
    set minDate(date: Date | undefined | null) {
        this._minDate = date;

        if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }
    /**
     * The maximum selectable date.
     * @group Props
     */
    @Input() get maxDate(): Date | undefined | null {
        return this._maxDate;
    }
    set maxDate(date: Date | undefined | null) {
        this._maxDate = date;

        if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }
    /**
     * Array with dates that should be disabled (not selectable).
     * @group Props
     */
    @Input() get disabledDates(): Date[] {
        return this._disabledDates;
    }
    set disabledDates(disabledDates: Date[]) {
        this._disabledDates = disabledDates;
        if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }
    /**
     * Array with weekday numbers that should be disabled (not selectable).
     * @group Props
     */
    @Input() get disabledDays(): number[] {
        return this._disabledDays;
    }
    set disabledDays(disabledDays: number[]) {
        this._disabledDays = disabledDays;

        if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }
    /**
     * The range of years displayed in the year drop-down in (nnnn:nnnn) format such as (2000:2020).
     * @group Props
     * @deprecated Years are based on decades by default.
     */
    @Input() get yearRange(): string {
        return this._yearRange;
    }
    set yearRange(yearRange: string) {
        this._yearRange = yearRange;

        if (yearRange) {
            const years = yearRange.split(':');
            const yearStart = parseInt(years[0]);
            const yearEnd = parseInt(years[1]);

            this.populateYearOptions(yearStart, yearEnd);
        }
    }
    /**
     * Whether to display timepicker.
     * @group Props
     */
    @Input() get showTime(): boolean {
        return this._showTime;
    }
    set showTime(showTime: boolean) {
        this._showTime = showTime;

        if (this.currentHour === undefined) {
            this.initTime(this.value || new Date());
        }
        this.updateInputfield();
    }
    /**
     * An array of options for responsive design.
     * @group Props
     */
    @Input() get responsiveOptions(): DatePickerResponsiveOptions[] {
        return this._responsiveOptions;
    }
    set responsiveOptions(responsiveOptions: DatePickerResponsiveOptions[]) {
        this._responsiveOptions = responsiveOptions;

        this.destroyResponsiveStyleElement();
        this.createResponsiveStyle();
    }
    /**
     * Number of months to display.
     * @group Props
     */
    @Input() get numberOfMonths(): number {
        return this._numberOfMonths;
    }
    set numberOfMonths(numberOfMonths: number) {
        this._numberOfMonths = numberOfMonths;

        this.destroyResponsiveStyleElement();
        this.createResponsiveStyle();
    }
    /**
     * Defines the first of the week for various date calculations.
     * @group Props
     */
    @Input() get firstDayOfWeek(): number {
        return this._firstDayOfWeek;
    }
    set firstDayOfWeek(firstDayOfWeek: number) {
        this._firstDayOfWeek = firstDayOfWeek;

        this.createWeekDays();
    }
    /**
     * Option to set datepicker locale.
     * @group Props
     * @deprecated Locale property has no effect, use new i18n API instead.
     */
    @Input() set locale(newLocale: LocaleSettings) {
        console.log('Locale property has no effect, use new i18n API instead.');
    }
    /**
     * Type of view to display, valid values are "date" for datepicker and "month" for month picker.
     * @group Props
     */
    @Input() get view(): DatePickerTypeView {
        return this._view;
    }
    set view(view: DatePickerTypeView) {
        this._view = view;
        this.currentView = this._view;
    }
    /**
     * Set the date to highlight on first opening if the field is blank.
     * @group Props
     */
    @Input() get defaultDate(): Date {
        return this._defaultDate;
    }
    set defaultDate(defaultDate: Date) {
        this._defaultDate = defaultDate;

        if (this.initialized) {
            const date = defaultDate || new Date();
            this.currentMonth = date.getMonth();
            this.currentYear = date.getFullYear();
            this.initTime(date);
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    /**
     * Callback to invoke on focus of input field.
     * @param {Event} event - browser event.
     * @group Emits
     */
    @Output() onFocus: EventEmitter<Event> = new EventEmitter<Event>();
    /**
     * Callback to invoke on blur of input field.
     * @param {Event} event - browser event.
     * @group Emits
     */
    @Output() onBlur: EventEmitter<Event> = new EventEmitter<Event>();
    /**
     * Callback to invoke when date panel closed.
     * @param {Event} event - Mouse event
     * @group Emits
     */
    @Output() onClose: EventEmitter<AnimationEvent> = new EventEmitter<AnimationEvent>();
    /**
     * Callback to invoke on date select.
     * @param {Date} date - date value.
     * @group Emits
     */
    @Output() onSelect: EventEmitter<Date> = new EventEmitter<Date>();
    /**
     * Callback to invoke when input field cleared.
     * @group Emits
     */
    @Output() onClear: EventEmitter<any> = new EventEmitter<any>();
    /**
     * Callback to invoke when input field is being typed.
     * @param {Event} event - browser event
     * @group Emits
     */
    @Output() onInput: EventEmitter<any> = new EventEmitter<any>();
    /**
     * Callback to invoke when today button is clicked.
     * @param {Date} date - today as a date instance.
     * @group Emits
     */
    @Output() onTodayClick: EventEmitter<Date> = new EventEmitter<Date>();
    /**
     * Callback to invoke when clear button is clicked.
     * @param {Event} event - browser event.
     * @group Emits
     */
    @Output() onClearClick: EventEmitter<any> = new EventEmitter<any>();
    /**
     * Callback to invoke when a month is changed using the navigators.
     * @param {DatePickerMonthChangeEvent} event - custom month change event.
     * @group Emits
     */
    @Output() onMonthChange: EventEmitter<DatePickerMonthChangeEvent> = new EventEmitter<DatePickerMonthChangeEvent>();
    /**
     * Callback to invoke when a year is changed using the navigators.
     * @param {DatePickerYearChangeEvent} event - custom year change event.
     * @group Emits
     */
    @Output() onYearChange: EventEmitter<DatePickerYearChangeEvent> = new EventEmitter<DatePickerYearChangeEvent>();
    /**
     * Callback to invoke when clicked outside of the date panel.
     * @group Emits
     */
    @Output() onClickOutside: EventEmitter<any> = new EventEmitter<any>();
    /**
     * Callback to invoke when datepicker panel is shown.
     * @group Emits
     */
    @Output() onShow: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('inputfield', { static: false }) inputfieldViewChild: Nullable<ElementRef>;

    @ViewChild('contentWrapper', { static: false }) set content(content: ElementRef) {
        this.contentViewChild = content;

        if (this.contentViewChild) {
            if (this.isMonthNavigate) {
                Promise.resolve(null).then(() => this.updateFocus());
                this.isMonthNavigate = false;
            } else {
                if (!this.focus && !this.inline) {
                    this.initFocusableCell();
                }
            }
        }
    }

    _componentStyle = inject(DatePickerStyle);

    contentViewChild!: ElementRef;

    value: any;

    dates: Nullable<Date[]>;

    months!: Month[];

    weekDays: Nullable<string[]>;

    currentMonth!: number;

    currentYear!: number;

    currentHour: Nullable<number>;

    currentMinute: Nullable<number>;

    currentSecond: Nullable<number>;

    pm: Nullable<boolean>;

    mask: Nullable<HTMLDivElement>;

    maskClickListener: VoidListener;

    overlay: Nullable<HTMLDivElement>;

    responsiveStyleElement: HTMLStyleElement | undefined | null;

    overlayVisible: Nullable<boolean>;

    onModelChange: Function = () => {};

    onModelTouched: Function = () => {};

    calendarElement: Nullable<HTMLElement | ElementRef>;

    timePickerTimer: any;

    documentClickListener: VoidListener;

    animationEndListener: VoidListener;

    ticksTo1970: Nullable<number>;

    yearOptions: Nullable<number[]>;

    focus: Nullable<boolean>;

    isKeydown: Nullable<boolean>;

    filled: Nullable<boolean>;

    inputFieldValue: Nullable<string> = null;

    _minDate?: Date | null;

    _maxDate?: Date | null;

    _dateFormat: string | undefined;

    _hourFormat: string = '24';

    _showTime!: boolean;

    _yearRange!: string;

    preventDocumentListener: Nullable<boolean>;

    dayClass(date) {
        return this._componentStyle.classes.day({ instance: this, date: date });
    }

    /**
     * Custom template for date cells.
     * @group Templates
     */
    @ContentChild('date', { descendants: false }) dateTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for header section.
     * @group Templates
     */
    @ContentChild('header', { descendants: false }) headerTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for footer section.
     * @group Templates
     */
    @ContentChild('footer', { descendants: false }) footerTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for disabled date cells.
     * @group Templates
     */
    @ContentChild('disabledDate', { descendants: false }) disabledDateTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for decade view.
     * @group Templates
     */
    @ContentChild('decade', { descendants: false }) decadeTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for previous month icon.
     * @group Templates
     */
    @ContentChild('previousicon', { descendants: false }) previousIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for next month icon.
     * @group Templates
     */
    @ContentChild('nexticon', { descendants: false }) nextIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for trigger icon.
     * @group Templates
     */
    @ContentChild('triggericon', { descendants: false }) triggerIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for clear icon.
     * @group Templates
     */
    @ContentChild('clearicon', { descendants: false }) clearIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for decrement icon.
     * @group Templates
     */
    @ContentChild('decrementicon', { descendants: false }) decrementIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for increment icon.
     * @group Templates
     */
    @ContentChild('incrementicon', { descendants: false }) incrementIconTemplate: Nullable<TemplateRef<any>>;

    /**
     * Custom template for input icon.
     * @group Templates
     */
    @ContentChild('inputicon', { descendants: false }) inputIconTemplate: Nullable<TemplateRef<any>>;

    _dateTemplate: TemplateRef<any> | undefined;

    _headerTemplate: TemplateRef<any> | undefined;

    _footerTemplate: TemplateRef<any> | undefined;

    _disabledDateTemplate: TemplateRef<any> | undefined;

    _decadeTemplate: TemplateRef<any> | undefined;

    _previousIconTemplate: TemplateRef<any> | undefined;

    _nextIconTemplate: TemplateRef<any> | undefined;

    _triggerIconTemplate: TemplateRef<any> | undefined;

    _clearIconTemplate: TemplateRef<any> | undefined;

    _decrementIconTemplate: TemplateRef<any> | undefined;

    _incrementIconTemplate: TemplateRef<any> | undefined;

    _inputIconTemplate: TemplateRef<any> | undefined;

    _disabledDates!: Array<Date>;

    _disabledDays!: Array<number>;

    selectElement: Nullable;

    todayElement: Nullable;

    focusElement: Nullable;

    scrollHandler: Nullable<ConnectedOverlayScrollHandler>;

    documentResizeListener: VoidListener;

    navigationState: Nullable<NavigationState> = null;

    isMonthNavigate: Nullable<boolean>;

    initialized: Nullable<boolean>;

    translationSubscription: Nullable<Subscription>;

    _locale!: LocaleSettings;

    _responsiveOptions!: DatePickerResponsiveOptions[];

    currentView: Nullable<string>;

    attributeSelector: Nullable<string>;

    panelId: Nullable<string>;

    _numberOfMonths: number = 1;

    _firstDayOfWeek!: number;

    _view: DatePickerTypeView = 'date';

    preventFocus: Nullable<boolean>;

    _defaultDate!: Date;

    _focusKey: Nullable<string> = null;

    private window: Window;

    get locale() {
        return this._locale;
    }

    get iconButtonAriaLabel() {
        return this.iconAriaLabel ? this.iconAriaLabel : this.getTranslation('chooseDate');
    }

    get prevIconAriaLabel() {
        return this.currentView === 'year' ? this.getTranslation('prevDecade') : this.currentView === 'month' ? this.getTranslation('prevYear') : this.getTranslation('prevMonth');
    }

    get nextIconAriaLabel() {
        return this.currentView === 'year' ? this.getTranslation('nextDecade') : this.currentView === 'month' ? this.getTranslation('nextYear') : this.getTranslation('nextMonth');
    }

    constructor(
        private zone: NgZone,
        public overlayService: OverlayService
    ) {
        super();
        this.window = this.document.defaultView as Window;
    }

    ngOnInit() {
        super.ngOnInit();
        this.attributeSelector = uuid('pn_id_');
        this.panelId = this.attributeSelector + '_panel';
        const date = this.defaultDate || new Date();
        this.createResponsiveStyle();
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();
        this.yearOptions = [];
        this.currentView = this.view;

        if (this.view === 'date') {
            this.createWeekDays();
            this.initTime(date);
            this.createMonths(this.currentMonth, this.currentYear);
            this.ticksTo1970 = ((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) + Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000;
        }

        this.translationSubscription = this.config.translationObserver.subscribe(() => {
            this.createWeekDays();
            this.cd.markForCheck();
        });

        this.initialized = true;
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        if (this.inline) {
            this.contentViewChild && this.contentViewChild.nativeElement.setAttribute(this.attributeSelector, '');

            if (!this.disabled() && !this.inline) {
                this.initFocusableCell();
                if (this.numberOfMonths === 1) {
                    if (this.contentViewChild && this.contentViewChild.nativeElement) {
                        this.contentViewChild.nativeElement.style.width = getOuterWidth(this.el?.nativeElement) + 'px';
                    }
                }
            }
        }
    }

    @ContentChildren(PrimeTemplate) templates!: QueryList<PrimeTemplate>;

    ngAfterContentInit() {
        this.templates.forEach((item) => {
            switch (item.getType()) {
                case 'date':
                    this._dateTemplate = item.template;
                    break;

                case 'decade':
                    this._decadeTemplate = item.template;
                    break;

                case 'disabledDate':
                    this._disabledDateTemplate = item.template;
                    break;

                case 'header':
                    this._headerTemplate = item.template;
                    break;

                case 'inputicon':
                    this._inputIconTemplate = item.template;
                    break;

                case 'previousicon':
                    this._previousIconTemplate = item.template;
                    break;

                case 'nexticon':
                    this._nextIconTemplate = item.template;
                    break;

                case 'triggericon':
                    this._triggerIconTemplate = item.template;
                    break;

                case 'clearicon':
                    this._clearIconTemplate = item.template;
                    break;

                case 'decrementicon':
                    this._decrementIconTemplate = item.template;
                    break;

                case 'incrementicon':
                    this._incrementIconTemplate = item.template;
                    break;

                case 'footer':
                    this._footerTemplate = item.template;
                    break;

                default:
                    this._dateTemplate = item.template;
                    break;
            }
        });
    }

    getTranslation(option: string) {
        return this.config.getTranslation(option);
    }

    populateYearOptions(start: number, end: number) {
        this.yearOptions = [];

        for (let i = start; i <= end; i++) {
            this.yearOptions.push(i);
        }
    }

    createWeekDays() {
        this.weekDays = [];
        let dayIndex = this.getFirstDateOfWeek();
        let dayLabels = this.getTranslation(TranslationKeys.DAY_NAMES_MIN);
        for (let i = 0; i < 7; i++) {
            this.weekDays.push(dayLabels[dayIndex]);
            dayIndex = dayIndex == 6 ? 0 : ++dayIndex;
        }
    }

    monthPickerValues() {
        let monthPickerValues = [];
        for (let i = 0; i <= 11; i++) {
            monthPickerValues.push(this.config.getTranslation('monthNamesShort')[i]);
        }

        return monthPickerValues;
    }

    yearPickerValues() {
        let yearPickerValues = [];
        let base = <number>this.currentYear - (<number>this.currentYear % 10);
        for (let i = 0; i < 10; i++) {
            yearPickerValues.push(base + i);
        }

        return yearPickerValues;
    }

    createMonths(month: number, year: number) {
        this.months = this.months = [];
        for (let i = 0; i < this.numberOfMonths; i++) {
            let m = month + i;
            let y = year;
            if (m > 11) {
                m = m % 12;
                y = year + Math.floor((month + i) / 12);
            }

            this.months.push(this.createMonth(m, y));
        }
    }

    getWeekNumber(date: Date) {
        let checkDate = new Date(date.getTime());
        if (this.startWeekFromFirstDayOfYear) {
            let firstDayOfWeek: number = +this.getFirstDateOfWeek();
            checkDate.setDate(checkDate.getDate() + 6 + firstDayOfWeek - checkDate.getDay());
        } else {
            checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
        }
        let time = checkDate.getTime();
        checkDate.setMonth(0);
        checkDate.setDate(1);
        return Math.floor(Math.round((time - checkDate.getTime()) / 86400000) / 7) + 1;
    }

    createMonth(month: number, year: number): Month {
        let dates = [];
        let firstDay = this.getFirstDayOfMonthIndex(month, year);
        let daysLength = this.getDaysCountInMonth(month, year);
        let prevMonthDaysLength = this.getDaysCountInPrevMonth(month, year);
        let dayNo = 1;
        let today = new Date();
        let weekNumbers = [];
        let monthRows = Math.ceil((daysLength + firstDay) / 7);

        for (let i = 0; i < monthRows; i++) {
            let week = [];

            if (i == 0) {
                for (let j = prevMonthDaysLength - firstDay + 1; j <= prevMonthDaysLength; j++) {
                    let prev = this.getPreviousMonthAndYear(month, year);
                    week.push({
                        day: j,
                        month: prev.month,
                        year: prev.year,
                        otherMonth: true,
                        today: this.isToday(today, j, prev.month, prev.year),
                        selectable: this.isSelectable(j, prev.month, prev.year, true)
                    });
                }

                let remainingDaysLength = 7 - week.length;
                for (let j = 0; j < remainingDaysLength; j++) {
                    week.push({
                        day: dayNo,
                        month: month,
                        year: year,
                        today: this.isToday(today, dayNo, month, year),
                        selectable: this.isSelectable(dayNo, month, year, false)
                    });
                    dayNo++;
                }
            } else {
                for (let j = 0; j < 7; j++) {
                    if (dayNo > daysLength) {
                        let next = this.getNextMonthAndYear(month, year);
                        week.push({
                            day: dayNo - daysLength,
                            month: next.month,
                            year: next.year,
                            otherMonth: true,
                            today: this.isToday(today, dayNo - daysLength, next.month, next.year),
                            selectable: this.isSelectable(dayNo - daysLength, next.month, next.year, true)
                        });
                    } else {
                        week.push({
                            day: dayNo,
                            month: month,
                            year: year,
                            today: this.isToday(today, dayNo, month, year),
                            selectable: this.isSelectable(dayNo, month, year, false)
                        });
                    }

                    dayNo++;
                }
            }

            if (this.showWeek) {
                weekNumbers.push(this.getWeekNumber(new Date(week[0].year, week[0].month, week[0].day)));
            }

            dates.push(week);
        }

        return {
            month: month,
            year: year,
            dates: <any>dates,
            weekNumbers: weekNumbers
        };
    }

    initTime(date: Date) {
        this.pm = date.getHours() > 11;

        if (this.showTime) {
            this.currentMinute = date.getMinutes();
            this.currentSecond = date.getSeconds();
            this.setCurrentHourPM(date.getHours());
        } else if (this.timeOnly) {
            this.currentMinute = 0;
            this.currentHour = 0;
            this.currentSecond = 0;
        }
    }

    navBackward(event: any) {
        if (this.disabled()) {
            event.preventDefault();
            return;
        }

        this.isMonthNavigate = true;

        if (this.currentView === 'month') {
            this.decrementYear();
            setTimeout(() => {
                this.updateFocus();
            }, 1);
        } else if (this.currentView === 'year') {
            this.decrementDecade();
            setTimeout(() => {
                this.updateFocus();
            }, 1);
        } else {
            if (this.currentMonth === 0) {
                this.currentMonth = 11;
                this.decrementYear();
            } else {
                this.currentMonth--;
            }

            this.onMonthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    navForward(event: any) {
        if (this.disabled()) {
            event.preventDefault();
            return;
        }

        this.isMonthNavigate = true;

        if (this.currentView === 'month') {
            this.incrementYear();
            setTimeout(() => {
                this.updateFocus();
            }, 1);
        } else if (this.currentView === 'year') {
            this.incrementDecade();
            setTimeout(() => {
                this.updateFocus();
            }, 1);
        } else {
            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.incrementYear();
            } else {
                this.currentMonth++;
            }

            this.onMonthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    decrementYear() {
        this.currentYear--;
        let _yearOptions = <number[]>this.yearOptions;

        if (this.yearNavigator && this.currentYear < _yearOptions[0]) {
            let difference = _yearOptions[_yearOptions.length - 1] - _yearOptions[0];
            this.populateYearOptions(_yearOptions[0] - difference, _yearOptions[_yearOptions.length - 1] - difference);
        }
    }

    decrementDecade() {
        this.currentYear = this.currentYear - 10;
    }

    incrementDecade() {
        this.currentYear = this.currentYear + 10;
    }

    incrementYear() {
        this.currentYear++;
        let _yearOptions = <number[]>this.yearOptions;

        if (this.yearNavigator && this.currentYear > _yearOptions[_yearOptions.length - 1]) {
            let difference = _yearOptions[_yearOptions.length - 1] - _yearOptions[0];
            this.populateYearOptions(_yearOptions[0] + difference, _yearOptions[_yearOptions.length - 1] + difference);
        }
    }

    switchToMonthView(event: Event) {
        this.setCurrentView('month');
        event.preventDefault();
    }

    switchToYearView(event: Event) {
        this.setCurrentView('year');
        event.preventDefault();
    }

    onDateSelect(event: Event, dateMeta: any) {
        if (this.disabled() || !dateMeta.selectable) {
            event.preventDefault();
            return;
        }

        if (this.isMultipleSelection() && this.isSelected(dateMeta)) {
            this.value = this.value.filter((date: Date, i: number) => {
                return !this.isDateEquals(date, dateMeta);
            });
            if (this.value.length === 0) {
                this.value = null;
            }
            this.updateModel(this.value);
        } else {
            if (this.shouldSelectDate(dateMeta)) {
                this.selectDate(dateMeta);
            }
        }

        if (this.hideOnDateTimeSelect && (this.isSingleSelection() || (this.isRangeSelection() && this.value[1]))) {
            setTimeout(() => {
                event.preventDefault();
                this.hideOverlay();

                if (this.mask) {
                    this.disableModality();
                }

                this.cd.markForCheck();
            }, 150);
        }

        this.updateInputfield();
        event.preventDefault();
    }

    shouldSelectDate(dateMeta: any) {
        if (this.isMultipleSelection()) return this.maxDateCount != null ? this.maxDateCount > (this.value ? this.value.length : 0) : true;
        else return true;
    }

    onMonthSelect(event: Event, index: number) {
        if (this.view === 'month') {
            this.onDateSelect(event, { year: this.currentYear, month: index, day: 1, selectable: true });
        } else {
            this.currentMonth = index;
            this.createMonths(this.currentMonth, this.currentYear);
            this.setCurrentView('date');
            this.onMonthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
        }
    }

    onYearSelect(event: Event, year: number) {
        if (this.view === 'year') {
            this.onDateSelect(event, { year: year, month: 0, day: 1, selectable: true });
        } else {
            this.currentYear = year;
            this.setCurrentView('month');
            this.onYearChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
        }
    }

    updateInputfield() {
        let formattedValue = '';

        if (this.value) {
            if (this.isSingleSelection()) {
                formattedValue = this.formatDateTime(this.value);
            } else if (this.isMultipleSelection()) {
                for (let i = 0; i < this.value.length; i++) {
                    let dateAsString = this.formatDateTime(this.value[i]);
                    formattedValue += dateAsString;
                    if (i !== this.value.length - 1) {
                        formattedValue += this.multipleSeparator + ' ';
                    }
                }
            } else if (this.isRangeSelection()) {
                if (this.value && this.value.length) {
                    let startDate = this.value[0];
                    let endDate = this.value[1];

                    formattedValue = this.formatDateTime(startDate);
                    if (endDate) {
                        formattedValue += ' ' + this.rangeSeparator + ' ' + this.formatDateTime(endDate);
                    }
                }
            }
        }

        this.inputFieldValue = formattedValue;
        this.updateFilledState();
        if (this.inputfieldViewChild && this.inputfieldViewChild.nativeElement) {
            this.inputfieldViewChild.nativeElement.value = this.inputFieldValue;
        }
    }

    formatDateTime(date: any) {
        let formattedValue = this.keepInvalid ? date : null;
        const isDateValid = this.isValidDateForTimeConstraints(date);

        if (this.isValidDate(date)) {
            if (this.timeOnly) {
                formattedValue = this.formatTime(date);
            } else {
                formattedValue = this.formatDate(date, this.getDateFormat());
                if (this.showTime) {
                    formattedValue += ' ' + this.formatTime(date);
                }
            }
        } else if (this.dataType === 'string') {
            formattedValue = date;
        }
        formattedValue = isDateValid ? formattedValue : '';
        return formattedValue;
    }

    formatDateMetaToDate(dateMeta: any): Date {
        return new Date(dateMeta.year, dateMeta.month, dateMeta.day);
    }

    formatDateKey(date: Date): string {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }

    setCurrentHourPM(hours: number) {
        if (this.hourFormat == '12') {
            this.pm = hours > 11;
            if (hours >= 12) {
                this.currentHour = hours == 12 ? 12 : hours - 12;
            } else {
                this.currentHour = hours == 0 ? 12 : hours;
            }
        } else {
            this.currentHour = hours;
        }
    }

    setCurrentView(currentView: DatePickerTypeView) {
        this.currentView = currentView;
        this.cd.detectChanges();
        this.alignOverlay();
    }

    selectDate(dateMeta: any) {
        let date = this.formatDateMetaToDate(dateMeta);

        if (this.showTime) {
            if (this.hourFormat == '12') {
                if (this.currentHour === 12) date.setHours(this.pm ? 12 : 0);
                else date.setHours(this.pm ? <number>this.currentHour + 12 : <number>this.currentHour);
            } else {
                date.setHours(<number>this.currentHour);
            }

            date.setMinutes(<number>this.currentMinute);
            date.setSeconds(<number>this.currentSecond);
        }

        if (this.minDate && this.minDate > date) {
            date = this.minDate;
            this.setCurrentHourPM(date.getHours());
            this.currentMinute = date.getMinutes();
            this.currentSecond = date.getSeconds();
        }

        if (this.maxDate && this.maxDate < date) {
            date = this.maxDate;
            this.setCurrentHourPM(date.getHours());
            this.currentMinute = date.getMinutes();
            this.currentSecond = date.getSeconds();
        }

        if (this.isSingleSelection()) {
            this.updateModel(date);
        } else if (this.isMultipleSelection()) {
            this.updateModel(this.value ? [...this.value, date] : [date]);
        } else if (this.isRangeSelection()) {
            if (this.value && this.value.length) {
                let startDate = this.value[0];
                let endDate = this.value[1];

                if (!endDate && date.getTime() >= startDate.getTime()) {
                    endDate = date;
                } else {
                    startDate = date;
                    endDate = null;
                }

                this.updateModel([startDate, endDate]);
            } else {
                this.updateModel([date, null]);
            }
        }

        this.onSelect.emit(date);
    }

    updateModel(value: any) {
        this.value = value;

        if (this.dataType == 'date') {
            this.onModelChange(this.value);
        } else if (this.dataType == 'string') {
            if (this.isSingleSelection()) {
                this.onModelChange(this.formatDateTime(this.value));
            } else {
                let stringArrValue = null;
                if (Array.isArray(this.value)) {
                    stringArrValue = this.value.map((date: Date) => this.formatDateTime(date));
                }
                this.onModelChange(stringArrValue);
            }
        }
    }

    getFirstDayOfMonthIndex(month: number, year: number) {
        let day = new Date();
        day.setDate(1);
        day.setMonth(month);
        day.setFullYear(year);

        let dayIndex = day.getDay() + this.getSundayIndex();
        return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
    }

    getDaysCountInMonth(month: number, year: number) {
        return 32 - this.daylightSavingAdjust(new Date(year, month, 32)).getDate();
    }

    getDaysCountInPrevMonth(month: number, year: number) {
        let prev = this.getPreviousMonthAndYear(month, year);
        return this.getDaysCountInMonth(prev.month, prev.year);
    }

    getPreviousMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 0) {
            m = 11;
            y = year - 1;
        } else {
            m = month - 1;
            y = year;
        }

        return { month: m, year: y };
    }

    getNextMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 11) {
            m = 0;
            y = year + 1;
        } else {
            m = month + 1;
            y = year;
        }

        return { month: m, year: y };
    }

    getSundayIndex() {
        let firstDayOfWeek = this.getFirstDateOfWeek();

        return firstDayOfWeek > 0 ? 7 - firstDayOfWeek : 0;
    }

    isSelected(dateMeta: any): boolean | undefined {
        if (this.value) {
            if (this.isSingleSelection()) {
                return this.isDateEquals(this.value, dateMeta);
            } else if (this.isMultipleSelection()) {
                let selected = false;
                for (let date of this.value) {
                    selected = this.isDateEquals(date, dateMeta);
                    if (selected) {
                        break;
                    }
                }

                return selected;
            } else if (this.isRangeSelection()) {
                if (this.value[1]) return this.isDateEquals(this.value[0], dateMeta) || this.isDateEquals(this.value[1], dateMeta) || this.isDateBetween(this.value[0], this.value[1], dateMeta);
                else return this.isDateEquals(this.value[0], dateMeta);
            }
        } else {
            return false;
        }
    }

    isComparable() {
        return this.value != null && typeof this.value !== 'string';
    }

    isMonthSelected(month) {
        if (!this.isComparable()) return false;

        if (this.isMultipleSelection()) {
            return this.value.some((currentValue) => currentValue.getMonth() === month && currentValue.getFullYear() === this.currentYear);
        } else if (this.isRangeSelection()) {
            if (!this.value[1]) {
                return this.value[0]?.getFullYear() === this.currentYear && this.value[0]?.getMonth() === month;
            } else {
                const currentDate = new Date(this.currentYear, month, 1);
                const startDate = new Date(this.value[0].getFullYear(), this.value[0].getMonth(), 1);
                const endDate = new Date(this.value[1].getFullYear(), this.value[1].getMonth(), 1);

                return currentDate >= startDate && currentDate <= endDate;
            }
        } else {
            return this.value.getMonth() === month && this.value.getFullYear() === this.currentYear;
        }
    }

    isMonthDisabled(month: number, year?: number) {
        const yearToCheck = year ?? this.currentYear;

        for (let day = 1; day < this.getDaysCountInMonth(month, yearToCheck) + 1; day++) {
            if (this.isSelectable(day, month, yearToCheck, false)) {
                return false;
            }
        }
        return true;
    }

    isYearDisabled(year: number) {
        return Array(12)
            .fill(0)
            .every((v, month) => this.isMonthDisabled(month, year));
    }

    isYearSelected(year: number) {
        if (this.isComparable()) {
            let value = this.isRangeSelection() ? this.value[0] : this.value;

            return !this.isMultipleSelection() ? value.getFullYear() === year : false;
        }

        return false;
    }

    isDateEquals(value: any, dateMeta: any) {
        if (value && isDate(value)) return value.getDate() === dateMeta.day && value.getMonth() === dateMeta.month && value.getFullYear() === dateMeta.year;
        else return false;
    }

    isDateBetween(start: Date, end: Date, dateMeta: any) {
        let between: boolean = false;
        if (isDate(start) && isDate(end)) {
            let date: Date = this.formatDateMetaToDate(dateMeta);
            return start.getTime() <= date.getTime() && end.getTime() >= date.getTime();
        }

        return between;
    }

    isSingleSelection(): boolean {
        return this.selectionMode === 'single';
    }

    isRangeSelection(): boolean {
        return this.selectionMode === 'range';
    }

    isMultipleSelection(): boolean {
        return this.selectionMode === 'multiple';
    }

    isToday(today: Date, day: number, month: number, year: number): boolean {
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    }

    isSelectable(day: any, month: any, year: any, otherMonth: any): boolean {
        let validMin = true;
        let validMax = true;
        let validDate = true;
        let validDay = true;

        if (otherMonth && !this.selectOtherMonths) {
            return false;
        }

        if (this.minDate) {
            if (this.minDate.getFullYear() > year) {
                validMin = false;
            } else if (this.minDate.getFullYear() === year && this.currentView != 'year') {
                if (this.minDate.getMonth() > month) {
                    validMin = false;
                } else if (this.minDate.getMonth() === month) {
                    if (this.minDate.getDate() > day) {
                        validMin = false;
                    }
                }
            }
        }

        if (this.maxDate) {
            if (this.maxDate.getFullYear() < year) {
                validMax = false;
            } else if (this.maxDate.getFullYear() === year) {
                if (this.maxDate.getMonth() < month) {
                    validMax = false;
                } else if (this.maxDate.getMonth() === month) {
                    if (this.maxDate.getDate() < day) {
                        validMax = false;
                    }
                }
            }
        }

        if (this.disabledDates) {
            validDate = !this.isDateDisabled(day, month, year);
        }

        if (this.disabledDays) {
            validDay = !this.isDayDisabled(day, month, year);
        }

        return validMin && validMax && validDate && validDay;
    }

    isDateDisabled(day: number, month: number, year: number): boolean {
        if (this.disabledDates) {
            for (let disabledDate of this.disabledDates) {
                if (disabledDate.getFullYear() === year && disabledDate.getMonth() === month && disabledDate.getDate() === day) {
                    return true;
                }
            }
        }

        return false;
    }

    isDayDisabled(day: number, month: number, year: number): boolean {
        if (this.disabledDays) {
            let weekday = new Date(year, month, day);
            let weekdayNumber = weekday.getDay();
            return this.disabledDays.indexOf(weekdayNumber) !== -1;
        }
        return false;
    }

    onInputFocus(event: Event) {
        this.focus = true;
        if (this.showOnFocus) {
            this.showOverlay();
        }
        this.onFocus.emit(event);
    }

    onInputClick() {
        if (this.showOnFocus && !this.overlayVisible) {
            this.showOverlay();
        }
    }

    onInputBlur(event: Event) {
        this.focus = false;
        this.onBlur.emit(event);
        if (!this.keepInvalid) {
            this.updateInputfield();
        }
        this.onModelTouched();
    }

    onButtonClick(event: Event, inputfield: any = this.inputfieldViewChild?.nativeElement) {
        if (this.disabled()) {
            return;
        }

        if (!this.overlayVisible) {
            inputfield.focus();
            this.showOverlay();
        } else {
            this.hideOverlay();
        }
    }

    clear() {
        this.value = null;
        this.onModelChange(this.value);
        this.updateInputfield();
        this.onClear.emit();
    }

    onOverlayClick(event: Event) {
        this.overlayService.add({
            originalEvent: event,
            target: this.el.nativeElement
        });
    }

    getMonthName(index: number) {
        return this.config.getTranslation('monthNames')[index];
    }

    getYear(month: any) {
        return this.currentView === 'month' ? this.currentYear : month.year;
    }

    switchViewButtonDisabled() {
        return this.numberOfMonths > 1 || this.disabled();
    }

    onPrevButtonClick(event: Event) {
        this.navigationState = { backward: true, button: true };
        this.navBackward(event);
    }

    onNextButtonClick(event: Event) {
        this.navigationState = { backward: false, button: true };
        this.navForward(event);
    }

    onContainerButtonKeydown(event: KeyboardEvent) {
        switch (event.which) {
            //tab
            case 9:
                if (!this.inline) {
                    this.trapFocus(event);
                }
                if (this.inline) {
                    const headerElements = findSingle(this.el?.nativeElement, '.p-datepicker-header');
                    const element = event.target;
                    if (this.timeOnly) {
                        return;
                    } else {
                        if (element == headerElements.children[headerElements?.children?.length - 1]) {
                            this.initFocusableCell();
                        }
                    }
                }
                break;

            //escape
            case 27:
                this.inputfieldViewChild?.nativeElement.focus();
                this.overlayVisible = false;
                event.preventDefault();
                break;

            default:
                //Noop
                break;
        }
    }

    onInputKeydown(event: any) {
        this.isKeydown = true;
        if (event.keyCode === 40 && this.contentViewChild) {
            this.trapFocus(event);
        } else if (event.keyCode === 27) {
            if (this.overlayVisible) {
                this.inputfieldViewChild?.nativeElement.focus();
                this.overlayVisible = false;
                event.preventDefault();
            }
        } else if (event.keyCode === 13) {
            if (this.overlayVisible) {
                this.overlayVisible = false;
                event.preventDefault();
            }
        } else if (event.keyCode === 9 && this.contentViewChild) {
            getFocusableElements(this.contentViewChild.nativeElement).forEach((el: any) => (el.tabIndex = '-1'));
            if (this.overlayVisible) {
                this.overlayVisible = false;
            }
        }
    }

    onDateCellKeydown(event: any, dateMeta: any, groupIndex: number) {
        const cellContent = event.currentTarget;
        const cell = cellContent.parentElement;
        const currentDate = this.formatDateMetaToDate(dateMeta);
        switch (event.which) {
            //down arrow
            case 40: {
                cellContent.tabIndex = '-1';
                let cellIndex = getIndex(cell);
                let nextRow = cell.parentElement.nextElementSibling;
                if (nextRow) {
                    let focusCell = nextRow.children[cellIndex].children[0];
                    if (hasClass(focusCell, 'p-disabled')) {
                        this.navigationState = { backward: false };
                        this.navForward(event);
                    } else {
                        nextRow.children[cellIndex].children[0].tabIndex = '0';
                        nextRow.children[cellIndex].children[0].focus();
                    }
                } else {
                    this.navigationState = { backward: false };
                    this.navForward(event);
                }
                event.preventDefault();
                break;
            }

            //up arrow
            case 38: {
                cellContent.tabIndex = '-1';
                let cellIndex = getIndex(cell);
                let prevRow = cell.parentElement.previousElementSibling;
                if (prevRow) {
                    let focusCell = prevRow.children[cellIndex].children[0];
                    if (hasClass(focusCell, 'p-disabled')) {
                        this.navigationState = { backward: true };
                        this.navBackward(event);
                    } else {
                        focusCell.tabIndex = '0';
                        focusCell.focus();
                    }
                } else {
                    this.navigationState = { backward: true };
                    this.navBackward(event);
                }
                event.preventDefault();
                break;
            }

            //left arrow
            case 37: {
                cellContent.tabIndex = '-1';
                let prevCell = cell.previousElementSibling;
                if (prevCell) {
                    let focusCell = prevCell.children[0];
                    if (hasClass(focusCell, 'p-disabled') || hasClass(focusCell.parentElement, 'p-datepicker-weeknumber')) {
                        this.navigateToMonth(true, groupIndex);
                    } else {
                        focusCell.tabIndex = '0';
                        focusCell.focus();
                    }
                } else {
                    this.navigateToMonth(true, groupIndex);
                }
                event.preventDefault();
                break;
            }

            //right arrow
            case 39: {
                cellContent.tabIndex = '-1';
                let nextCell = cell.nextElementSibling;
                if (nextCell) {
                    let focusCell = nextCell.children[0];
                    if (hasClass(focusCell, 'p-disabled')) {
                        this.navigateToMonth(false, groupIndex);
                    } else {
                        focusCell.tabIndex = '0';
                        focusCell.focus();
                    }
                } else {
                    this.navigateToMonth(false, groupIndex);
                }
                event.preventDefault();
                break;
            }

            //enter
            //space
            case 13:
            case 32: {
                this.onDateSelect(event, dateMeta);
                event.preventDefault();
                break;
            }

            //escape
            case 27: {
                this.inputfieldViewChild?.nativeElement.focus();
                this.overlayVisible = false;
                event.preventDefault();
                break;
            }

            //tab
            case 9: {
                if (!this.inline) {
                    this.trapFocus(event);
                }
                break;
            }

            // page up
            case 33: {
                cellContent.tabIndex = '-1';
                const dateToFocus = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
                const focusKey = this.formatDateKey(dateToFocus);
                this.navigateToMonth(true, groupIndex, `span[data-date='${focusKey}']:not(.p-disabled):not(.p-ink)`);
                event.preventDefault();
                break;
            }

            // page down
            case 34: {
                cellContent.tabIndex = '-1';
                const dateToFocus = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
                const focusKey = this.formatDateKey(dateToFocus);
                this.navigateToMonth(false, groupIndex, `span[data-date='${focusKey}']:not(.p-disabled):not(.p-ink)`);
                event.preventDefault();
                break;
            }

            //home
            case 36:
                cellContent.tabIndex = '-1';
                const firstDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const firstDayDateKey = this.formatDateKey(firstDayDate);
                const firstDayCell = <any>findSingle(cellContent.offsetParent, `span[data-date='${firstDayDateKey}']:not(.p-disabled):not(.p-ink)`);
                if (firstDayCell) {
                    firstDayCell.tabIndex = '0';
                    firstDayCell.focus();
                }
                event.preventDefault();
                break;

            //end
            case 35:
                cellContent.tabIndex = '-1';
                const lastDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                const lastDayDateKey = this.formatDateKey(lastDayDate);
                const lastDayCell = <any>findSingle(cellContent.offsetParent, `span[data-date='${lastDayDateKey}']:not(.p-disabled):not(.p-ink)`);
                if (lastDayDate) {
                    lastDayCell.tabIndex = '0';
                    lastDayCell.focus();
                }
                event.preventDefault();
                break;

            default:
                //no op
                break;
        }
    }

    onMonthCellKeydown(event: any, index: number) {
        const cell = event.currentTarget;
        switch (event.which) {
            //arrows
            case 38:
            case 40: {
                cell.tabIndex = '-1';
                var cells = cell.parentElement.children;
                var cellIndex = getIndex(cell);
                let nextCell = cells[event.which === 40 ? cellIndex + 3 : cellIndex - 3];
                if (nextCell) {
                    nextCell.tabIndex = '0';
                    nextCell.focus();
                }
                event.preventDefault();
                break;
            }

            //left arrow
            case 37: {
                cell.tabIndex = '-1';
                let prevCell = cell.previousElementSibling;
                if (prevCell) {
                    prevCell.tabIndex = '0';
                    prevCell.focus();
                } else {
                    this.navigationState = { backward: true };
                    this.navBackward(event);
                }

                event.preventDefault();
                break;
            }

            //right arrow
            case 39: {
                cell.tabIndex = '-1';
                let nextCell = cell.nextElementSibling;
                if (nextCell) {
                    nextCell.tabIndex = '0';
                    nextCell.focus();
                } else {
                    this.navigationState = { backward: false };
                    this.navForward(event);
                }

                event.preventDefault();
                break;
            }

            //enter
            //space
            case 13:
            case 32: {
                this.onMonthSelect(event, index);
                event.preventDefault();
                break;
            }

            //escape
            case 27: {
                this.inputfieldViewChild?.nativeElement.focus();
                this.overlayVisible = false;
                event.preventDefault();
                break;
            }

            //tab
            case 9: {
                if (!this.inline) {
                    this.trapFocus(event);
                }
                break;
            }

            default:
                //no op
                break;
        }
    }

    onYearCellKeydown(event: any, index: number) {
        const cell = event.currentTarget;

        switch (event.which) {
            //arrows
            case 38:
            case 40: {
                cell.tabIndex = '-1';
                var cells = cell.parentElement.children;
                var cellIndex = getIndex(cell);
                let nextCell = cells[event.which === 40 ? cellIndex + 2 : cellIndex - 2];
                if (nextCell) {
                    nextCell.tabIndex = '0';
                    nextCell.focus();
                }
                event.preventDefault();
                break;
            }

            //left arrow
            case 37: {
                cell.tabIndex = '-1';
                let prevCell = cell.previousElementSibling;
                if (prevCell) {
                    prevCell.tabIndex = '0';
                    prevCell.focus();
                } else {
                    this.navigationState = { backward: true };
                    this.navBackward(event);
                }

                event.preventDefault();
                break;
            }

            //right arrow
            case 39: {
                cell.tabIndex = '-1';
                let nextCell = cell.nextElementSibling;
                if (nextCell) {
                    nextCell.tabIndex = '0';
                    nextCell.focus();
                } else {
                    this.navigationState = { backward: false };
                    this.navForward(event);
                }

                event.preventDefault();
                break;
            }

            //enter
            //space
            case 13:
            case 32: {
                this.onYearSelect(event, index);
                event.preventDefault();
                break;
            }

            //escape
            case 27: {
                this.inputfieldViewChild?.nativeElement.focus();
                this.overlayVisible = false;
                event.preventDefault();
                break;
            }

            //tab
            case 9: {
                this.trapFocus(event);
                break;
            }

            default:
                //no op
                break;
        }
    }

    navigateToMonth(prev: boolean, groupIndex: number, focusKey?: string) {
        if (prev) {
            if (this.numberOfMonths === 1 || groupIndex === 0) {
                this.navigationState = { backward: true };
                this._focusKey = focusKey;
                this.navBackward(event);
            } else {
                let prevMonthContainer = this.contentViewChild.nativeElement.children[groupIndex - 1];
                if (focusKey) {
                    const firstDayCell = <any>findSingle(prevMonthContainer, focusKey);
                    firstDayCell.tabIndex = '0';
                    firstDayCell.focus();
                } else {
                    let cells = <any>find(prevMonthContainer, '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
                    let focusCell = cells[cells.length - 1];
                    focusCell.tabIndex = '0';
                    focusCell.focus();
                }
            }
        } else {
            if (this.numberOfMonths === 1 || groupIndex === this.numberOfMonths - 1) {
                this.navigationState = { backward: false };
                this._focusKey = focusKey;
                this.navForward(event);
            } else {
                let nextMonthContainer = this.contentViewChild.nativeElement.children[groupIndex + 1];
                if (focusKey) {
                    const firstDayCell = <any>findSingle(nextMonthContainer, focusKey);
                    firstDayCell.tabIndex = '0';
                    firstDayCell.focus();
                } else {
                    let focusCell = <any>findSingle(nextMonthContainer, '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
                    focusCell.tabIndex = '0';
                    focusCell.focus();
                }
            }
        }
    }

    updateFocus() {
        let cell;

        if (this.navigationState) {
            if (this.navigationState.button) {
                this.initFocusableCell();

                if (this.navigationState.backward) (findSingle(this.contentViewChild.nativeElement, '.p-datepicker-prev-button') as any).focus();
                else (findSingle(this.contentViewChild.nativeElement, '.p-datepicker-next-button') as any).focus();
            } else {
                if (this.navigationState.backward) {
                    let cells;

                    if (this.currentView === 'month') {
                        cells = find(this.contentViewChild.nativeElement, '.p-datepicker-month-view .p-datepicker-month:not(.p-disabled)');
                    } else if (this.currentView === 'year') {
                        cells = find(this.contentViewChild.nativeElement, '.p-datepicker-year-view .p-datepicker-year:not(.p-disabled)');
                    } else {
                        cells = find(this.contentViewChild.nativeElement, this._focusKey || '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
                    }

                    if (cells && cells.length > 0) {
                        cell = cells[cells.length - 1];
                    }
                } else {
                    if (this.currentView === 'month') {
                        cell = findSingle(this.contentViewChild.nativeElement, '.p-datepicker-month-view .p-datepicker-month:not(.p-disabled)');
                    } else if (this.currentView === 'year') {
                        cell = findSingle(this.contentViewChild.nativeElement, '.p-datepicker-year-view .p-datepicker-year:not(.p-disabled)');
                    } else {
                        cell = findSingle(this.contentViewChild.nativeElement, this._focusKey || '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
                    }
                }

                if (cell) {
                    cell.tabIndex = '0';
                    cell.focus();
                }
            }

            this.navigationState = null;
            this._focusKey = null;
        } else {
            this.initFocusableCell();
        }
    }

    initFocusableCell() {
        const contentEl = this.contentViewChild?.nativeElement;
        let cell!: any;

        if (this.currentView === 'month') {
            let cells = find(contentEl, '.p-datepicker-month-view .p-datepicker-month:not(.p-disabled)');
            let selectedCell = <any>findSingle(contentEl, '.p-datepicker-month-view .p-datepicker-month.p-highlight');
            cells.forEach((cell: any) => (cell.tabIndex = -1));
            cell = selectedCell || cells[0];

            if (cells.length === 0) {
                let disabledCells = find(contentEl, '.p-datepicker-month-view .p-datepicker-month.p-disabled[tabindex = "0"]');
                disabledCells.forEach((cell: any) => (cell.tabIndex = -1));
            }
        } else if (this.currentView === 'year') {
            let cells = find(contentEl, '.p-datepicker-year-view .p-datepicker-year:not(.p-disabled)');
            let selectedCell = findSingle(contentEl, '.p-datepicker-year-view .p-datepicker-year.p-highlight');
            cells.forEach((cell: any) => (cell.tabIndex = -1));
            cell = selectedCell || cells[0];

            if (cells.length === 0) {
                let disabledCells = find(contentEl, '.p-datepicker-year-view .p-datepicker-year.p-disabled[tabindex = "0"]');
                disabledCells.forEach((cell: any) => (cell.tabIndex = -1));
            }
        } else {
            cell = findSingle(contentEl, 'span.p-highlight');
            if (!cell) {
                let todayCell = findSingle(contentEl, 'td.p-datepicker-today span:not(.p-disabled):not(.p-ink)');
                if (todayCell) cell = todayCell;
                else cell = findSingle(contentEl, '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
            }
        }

        if (cell) {
            cell.tabIndex = '0';

            if (!this.preventFocus && (!this.navigationState || !this.navigationState.button)) {
                setTimeout(() => {
                    if (!this.disabled()) {
                        cell.focus();
                    }
                }, 1);
            }

            this.preventFocus = false;
        }
    }

    trapFocus(event: any) {
        let focusableElements = <any>getFocusableElements(this.contentViewChild.nativeElement);

        if (focusableElements && focusableElements.length > 0) {
            if (!focusableElements[0].ownerDocument.activeElement) {
                focusableElements[0].focus();
            } else {
                let focusedIndex = focusableElements.indexOf(focusableElements[0].ownerDocument.activeElement);

                if (event.shiftKey) {
                    if (focusedIndex == -1 || focusedIndex === 0) {
                        if (this.focusTrap) {
                            focusableElements[focusableElements.length - 1].focus();
                        } else {
                            if (focusedIndex === -1) return this.hideOverlay();
                            else if (focusedIndex === 0) return;
                        }
                    } else {
                        focusableElements[focusedIndex - 1].focus();
                    }
                } else {
                    if (focusedIndex == -1) {
                        if (this.timeOnly) {
                            focusableElements[0].focus();
                        } else {
                            let spanIndex = 0;

                            for (let i = 0; i < focusableElements.length; i++) {
                                if (focusableElements[i].tagName === 'SPAN') spanIndex = i;
                            }

                            focusableElements[spanIndex].focus();
                        }
                    } else if (focusedIndex === focusableElements.length - 1) {
                        if (!this.focusTrap && focusedIndex != -1) return this.hideOverlay();

                        focusableElements[0].focus();
                    } else {
                        focusableElements[focusedIndex + 1].focus();
                    }
                }
            }
        }

        event.preventDefault();
    }

    onMonthDropdownChange(m: string) {
        this.currentMonth = parseInt(m);
        this.onMonthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
        this.createMonths(this.currentMonth, this.currentYear);
    }

    onYearDropdownChange(y: string) {
        this.currentYear = parseInt(y);
        this.onYearChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
        this.createMonths(this.currentMonth, this.currentYear);
    }

    convertTo24Hour(hours: number, pm: boolean) {
        //@ts-ignore
        if (this.hourFormat == '12') {
            if (hours === 12) {
                return pm ? 12 : 0;
            } else {
                return pm ? hours + 12 : hours;
            }
        }
        return hours;
    }

    constrainTime(hour: number, minute: number, second: number, pm: boolean) {
        let returnTimeTriple: number[] = [hour, minute, second];
        let minHoursExceeds12: boolean;
        let value = this.value;
        const convertedHour = this.convertTo24Hour(hour, pm);
        const isRange = this.isRangeSelection(),
            isMultiple = this.isMultipleSelection(),
            isMultiValue = isRange || isMultiple;

        if (isMultiValue) {
            if (!this.value) {
                this.value = [new Date(), new Date()];
            }
            if (isRange) {
                value = this.value[1] || this.value[0];
            }
            if (isMultiple) {
                value = this.value[this.value.length - 1];
            }
        }
        const valueDateString = value ? value.toDateString() : null;
        let isMinDate = this.minDate && valueDateString && this.minDate.toDateString() === valueDateString;
        let isMaxDate = this.maxDate && valueDateString && this.maxDate.toDateString() === valueDateString;

        if (isMinDate) {
            minHoursExceeds12 = this.minDate.getHours() >= 12;
        }

        switch (
            true // intentional fall through
        ) {
            case isMinDate && minHoursExceeds12 && this.minDate.getHours() === 12 && this.minDate.getHours() > convertedHour:
                returnTimeTriple[0] = 11;
            case isMinDate && this.minDate.getHours() === convertedHour && this.minDate.getMinutes() > minute:
                returnTimeTriple[1] = this.minDate.getMinutes();
            case isMinDate && this.minDate.getHours() === convertedHour && this.minDate.getMinutes() === minute && this.minDate.getSeconds() > second:
                returnTimeTriple[2] = this.minDate.getSeconds();
                break;
            case isMinDate && !minHoursExceeds12 && this.minDate.getHours() - 1 === convertedHour && this.minDate.getHours() > convertedHour:
                returnTimeTriple[0] = 11;
                this.pm = true;
            case isMinDate && this.minDate.getHours() === convertedHour && this.minDate.getMinutes() > minute:
                returnTimeTriple[1] = this.minDate.getMinutes();
            case isMinDate && this.minDate.getHours() === convertedHour && this.minDate.getMinutes() === minute && this.minDate.getSeconds() > second:
                returnTimeTriple[2] = this.minDate.getSeconds();
                break;

            case isMinDate && minHoursExceeds12 && this.minDate.getHours() > convertedHour && convertedHour !== 12:
                this.setCurrentHourPM(this.minDate.getHours());
                returnTimeTriple[0] = this.currentHour;
            case isMinDate && this.minDate.getHours() === convertedHour && this.minDate.getMinutes() > minute:
                returnTimeTriple[1] = this.minDate.getMinutes();
            case isMinDate && this.minDate.getHours() === convertedHour && this.minDate.getMinutes() === minute && this.minDate.getSeconds() > second:
                returnTimeTriple[2] = this.minDate.getSeconds();
                break;
            case isMinDate && this.minDate.getHours() > convertedHour:
                returnTimeTriple[0] = this.minDate.getHours();
            case isMinDate && this.minDate.getHours() === convertedHour && this.minDate.getMinutes() > minute:
                returnTimeTriple[1] = this.minDate.getMinutes();
            case isMinDate && this.minDate.getHours() === convertedHour && this.minDate.getMinutes() === minute && this.minDate.getSeconds() > second:
                returnTimeTriple[2] = this.minDate.getSeconds();
                break;
            case isMaxDate && this.maxDate.getHours() < convertedHour:
                returnTimeTriple[0] = this.maxDate.getHours();
            case isMaxDate && this.maxDate.getHours() === convertedHour && this.maxDate.getMinutes() < minute:
                returnTimeTriple[1] = this.maxDate.getMinutes();
            case isMaxDate && this.maxDate.getHours() === convertedHour && this.maxDate.getMinutes() === minute && this.maxDate.getSeconds() < second:
                returnTimeTriple[2] = this.maxDate.getSeconds();
                break;
        }

        return returnTimeTriple;
    }

    incrementHour(event: any) {
        const prevHour = this.currentHour ?? 0;
        let newHour = (this.currentHour ?? 0) + this.stepHour;
        let newPM = this.pm;
        if (this.hourFormat == '24') newHour = newHour >= 24 ? newHour - 24 : newHour;
        else if (this.hourFormat == '12') {
            // Before the AM/PM break, now after
            if (prevHour < 12 && newHour > 11) {
                newPM = !this.pm;
            }
            newHour = newHour >= 13 ? newHour - 12 : newHour;
        }
        this.toggleAMPMIfNotMinDate(newPM);
        [this.currentHour, this.currentMinute, this.currentSecond] = this.constrainTime(newHour, this.currentMinute!, this.currentSecond!, newPM!);
        event.preventDefault();
    }

    toggleAMPMIfNotMinDate(newPM: boolean) {
        let value = this.value;
        const valueDateString = value ? value.toDateString() : null;
        let isMinDate = this.minDate && valueDateString && this.minDate.toDateString() === valueDateString;
        if (isMinDate && this.minDate.getHours() >= 12) {
            this.pm = true;
        } else {
            this.pm = newPM;
        }
    }

    onTimePickerElementMouseDown(event: Event, type: number, direction: number) {
        if (!this.disabled()) {
            this.repeat(event, null, type, direction);
            event.preventDefault();
        }
    }

    onTimePickerElementMouseUp(event: Event) {
        if (!this.disabled()) {
            this.clearTimePickerTimer();
            this.updateTime();
        }
    }

    onTimePickerElementMouseLeave() {
        if (!this.disabled() && this.timePickerTimer) {
            this.clearTimePickerTimer();
            this.updateTime();
        }
    }

    repeat(event: Event | null, interval: number | null, type: number | null, direction: number | null) {
        let i = interval || 500;

        this.clearTimePickerTimer();
        this.timePickerTimer = setTimeout(() => {
            this.repeat(event, 100, type, direction);
            this.cd.markForCheck();
        }, i);

        switch (type) {
            case 0:
                if (direction === 1) this.incrementHour(event);
                else this.decrementHour(event);
                break;

            case 1:
                if (direction === 1) this.incrementMinute(event);
                else this.decrementMinute(event);
                break;

            case 2:
                if (direction === 1) this.incrementSecond(event);
                else this.decrementSecond(event);
                break;
        }

        this.updateInputfield();
    }

    clearTimePickerTimer() {
        if (this.timePickerTimer) {
            clearTimeout(this.timePickerTimer);
            this.timePickerTimer = null;
        }
    }

    decrementHour(event: any) {
        let newHour = (this.currentHour ?? 0) - this.stepHour;
        let newPM = this.pm;
        if (this.hourFormat == '24') newHour = newHour < 0 ? 24 + newHour : newHour;
        else if (this.hourFormat == '12') {
            // If we were at noon/midnight, then switch
            if (this.currentHour === 12) {
                newPM = !this.pm;
            }
            newHour = newHour <= 0 ? 12 + newHour : newHour;
        }
        this.toggleAMPMIfNotMinDate(newPM);
        [this.currentHour, this.currentMinute, this.currentSecond] = this.constrainTime(newHour, this.currentMinute!, this.currentSecond!, newPM!);
        event.preventDefault();
    }

    incrementMinute(event: any) {
        let newMinute = (this.currentMinute ?? 0) + this.stepMinute;
        newMinute = newMinute > 59 ? newMinute - 60 : newMinute;
        [this.currentHour, this.currentMinute, this.currentSecond] = this.constrainTime(this.currentHour, newMinute, this.currentSecond!, this.pm!);
        event.preventDefault();
    }

    decrementMinute(event: any) {
        let newMinute = (this.currentMinute ?? 0) - this.stepMinute;
        newMinute = newMinute < 0 ? 60 + newMinute : newMinute;
        [this.currentHour, this.currentMinute, this.currentSecond] = this.constrainTime(this.currentHour, newMinute, this.currentSecond, this.pm);
        event.preventDefault();
    }

    incrementSecond(event: any) {
        let newSecond = <any>this.currentSecond + this.stepSecond;
        newSecond = newSecond > 59 ? newSecond - 60 : newSecond;
        [this.currentHour, this.currentMinute, this.currentSecond] = this.constrainTime(this.currentHour, this.currentMinute, newSecond, this.pm);
        event.preventDefault();
    }

    decrementSecond(event: any) {
        let newSecond = <any>this.currentSecond - this.stepSecond;
        newSecond = newSecond < 0 ? 60 + newSecond : newSecond;
        [this.currentHour, this.currentMinute, this.currentSecond] = this.constrainTime(this.currentHour, this.currentMinute, newSecond, this.pm);
        event.preventDefault();
    }

    updateTime() {
        let value = this.value;
        if (this.isRangeSelection()) {
            value = this.value[1] || this.value[0];
        }
        if (this.isMultipleSelection()) {
            value = this.value[this.value.length - 1];
        }
        value = value ? new Date(value.getTime()) : new Date();

        if (this.hourFormat == '12') {
            if (this.currentHour === 12) value.setHours(this.pm ? 12 : 0);
            else value.setHours(this.pm ? <number>this.currentHour + 12 : this.currentHour);
        } else {
            value.setHours(this.currentHour);
        }

        value.setMinutes(this.currentMinute);
        value.setSeconds(this.currentSecond);
        if (this.isRangeSelection()) {
            if (this.value[1]) value = [this.value[0], value];
            else value = [value, null];
        }

        if (this.isMultipleSelection()) {
            value = [...this.value.slice(0, -1), value];
        }

        this.updateModel(value);
        this.onSelect.emit(value);
        this.updateInputfield();
    }

    toggleAMPM(event: any) {
        const newPM = !this.pm;
        this.pm = newPM;
        [this.currentHour, this.currentMinute, this.currentSecond] = this.constrainTime(this.currentHour, this.currentMinute, this.currentSecond, newPM);
        this.updateTime();
        event.preventDefault();
    }

    onUserInput(event: KeyboardEvent | any) {
        // IE 11 Workaround for input placeholder : https://github.com/primefaces/primeng/issues/2026
        if (!this.isKeydown) {
            return;
        }
        this.isKeydown = false;

        let val = (<HTMLInputElement>event.target).value;
        try {
            let value = this.parseValueFromString(val);
            if (this.isValidSelection(value)) {
                this.updateModel(value);
                this.updateUI();
            } else if (this.keepInvalid) {
                this.updateModel(value);
            }
        } catch (err) {
            //invalid date
            let value = this.keepInvalid ? val : null;
            this.updateModel(value);
        }

        this.filled = (val != null && val.length) as any;
        this.onInput.emit(event);
    }

    isValidSelection(value: any): boolean {
        if (this.isSingleSelection()) {
            return this.isSelectable(value.getDate(), value.getMonth(), value.getFullYear(), false);
        }
        let isValid = value.every((v: any) => this.isSelectable(v.getDate(), v.getMonth(), v.getFullYear(), false));
        if (isValid && this.isRangeSelection()) {
            isValid = value.length === 1 || (value.length > 1 && value[1] >= value[0]);
        }
        return isValid;
    }

    parseValueFromString(text: string): Date | Date[] | null {
        if (!text || text.trim().length === 0) {
            return null;
        }

        let value: any;

        if (this.isSingleSelection()) {
            value = this.parseDateTime(text);
        } else if (this.isMultipleSelection()) {
            let tokens = text.split(this.multipleSeparator);
            value = [];
            for (let token of tokens) {
                value.push(this.parseDateTime(token.trim()));
            }
        } else if (this.isRangeSelection()) {
            let tokens = text.split(' ' + this.rangeSeparator + ' ');
            value = [];
            for (let i = 0; i < tokens.length; i++) {
                value[i] = this.parseDateTime(tokens[i].trim());
            }
        }

        return value;
    }

    parseDateTime(text: any): Date {
        let date: Date;
        let parts: string[] = text.split(' ');

        if (this.timeOnly) {
            date = new Date();
            this.populateTime(date, parts[0], parts[1]);
        } else {
            const dateFormat = this.getDateFormat();
            if (this.showTime) {
                let ampm = this.hourFormat == '12' ? parts.pop() : null;
                let timeString = parts.pop();

                date = this.parseDate(parts.join(' '), dateFormat);
                this.populateTime(date, timeString, ampm);
            } else {
                date = this.parseDate(text, dateFormat);
            }
        }

        return date;
    }

    populateTime(value: any, timeString: any, ampm: any) {
        if (this.hourFormat == '12' && !ampm) {
            throw 'Invalid Time';
        }

        this.pm = ampm === 'PM' || ampm === 'pm';
        let time = this.parseTime(timeString);
        value.setHours(time.hour);
        value.setMinutes(time.minute);
        value.setSeconds(time.second);
    }

    isValidDate(date: any) {
        return isDate(date) && isNotEmpty(date);
    }

    updateUI() {
        let propValue = this.value;
        if (Array.isArray(propValue)) {
            propValue = propValue.length === 2 ? propValue[1] : propValue[0];
        }

        let val = this.defaultDate && this.isValidDate(this.defaultDate) && !this.value ? this.defaultDate : propValue && this.isValidDate(propValue) ? propValue : new Date();

        this.currentMonth = val.getMonth();
        this.currentYear = val.getFullYear();
        this.createMonths(this.currentMonth, this.currentYear);

        if (this.showTime || this.timeOnly) {
            this.setCurrentHourPM(val.getHours());
            this.currentMinute = val.getMinutes();
            this.currentSecond = val.getSeconds();
        }
    }

    showOverlay() {
        if (!this.overlayVisible) {
            this.updateUI();

            if (!this.touchUI) {
                this.preventFocus = true;
            }

            this.overlayVisible = true;
        }
    }

    hideOverlay() {
        this.inputfieldViewChild?.nativeElement.focus();
        this.overlayVisible = false;
        this.clearTimePickerTimer();

        if (this.touchUI) {
            this.disableModality();
        }

        this.cd.markForCheck();
    }

    toggle() {
        if (!this.inline) {
            if (!this.overlayVisible) {
                this.showOverlay();
                this.inputfieldViewChild?.nativeElement.focus();
            } else {
                this.hideOverlay();
            }
        }
    }

    onOverlayAnimationStart(event: AnimationEvent) {
        switch (event.toState) {
            case 'visible':
            case 'visibleTouchUI':
                if (!this.inline) {
                    this.overlay = event.element;
                    this.overlay?.setAttribute(this.attributeSelector as string, '');

                    const styles = !this.inline ? { position: 'absolute', top: '0', left: '0' } : undefined;
                    addStyle(this.overlay, styles);

                    this.appendOverlay();
                    this.updateFocus();
                    if (this.autoZIndex) {
                        if (this.touchUI) ZIndexUtils.set('modal', this.overlay, this.baseZIndex || this.config.zIndex.modal);
                        else ZIndexUtils.set('overlay', this.overlay, this.baseZIndex || this.config.zIndex.overlay);
                    }

                    this.alignOverlay();
                    this.onShow.emit(event);
                }
                break;

            case 'void':
                this.onOverlayHide();
                this.onClose.emit(event);
                break;
        }
    }

    onOverlayAnimationDone(event: AnimationEvent) {
        switch (event.toState) {
            case 'visible':
            case 'visibleTouchUI':
                if (!this.inline) {
                    this.bindDocumentClickListener();
                    this.bindDocumentResizeListener();
                    this.bindScrollListener();
                }
                break;

            case 'void':
                if (this.autoZIndex) {
                    ZIndexUtils.clear(event.element);
                }
                break;
        }
    }

    appendOverlay() {
        if (this.appendTo) {
            if (this.appendTo === 'body') this.document.body.appendChild(<HTMLElement>this.overlay);
            else appendChild(this.appendTo, this.overlay);
        }
    }

    restoreOverlayAppend() {
        if (this.overlay && this.appendTo) {
            this.el.nativeElement.appendChild(this.overlay);
        }
    }

    alignOverlay() {
        if (this.touchUI) {
            this.enableModality(this.overlay);
        } else if (this.overlay) {
            if (this.appendTo) {
                if (this.view === 'date') {
                    if (!this.overlay.style.width) {
                        this.overlay.style.width = getOuterWidth(this.overlay) + 'px';
                    }
                    if (!this.overlay.style.minWidth) {
                        this.overlay.style.minWidth = getOuterWidth(this.inputfieldViewChild?.nativeElement) + 'px';
                    }
                } else {
                    if (!this.overlay.style.width) {
                        this.overlay.style.width = getOuterWidth(this.inputfieldViewChild?.nativeElement) + 'px';
                    }
                }
                absolutePosition(this.overlay, this.inputfieldViewChild?.nativeElement);
            } else {
                relativePosition(this.overlay, this.inputfieldViewChild?.nativeElement);
            }
        }
    }

    enableModality(element: any) {
        if (!this.mask && this.touchUI) {
            this.mask = this.renderer.createElement('div');
            this.renderer.setStyle(this.mask, 'zIndex', String(parseInt(element.style.zIndex) - 1));
            let maskStyleClass = 'p-overlay-mask p-datepicker-mask p-datepicker-mask-scrollblocker p-overlay-mask p-overlay-mask-enter';
            addClass(this.mask, maskStyleClass);

            this.maskClickListener = this.renderer.listen(this.mask, 'click', (event: any) => {
                this.disableModality();
                this.overlayVisible = false;
            });
            this.renderer.appendChild(this.document.body, this.mask);
            blockBodyScroll();
        }
    }

    disableModality() {
        if (this.mask) {
            addClass(this.mask, 'p-overlay-mask-leave');
            if (!this.animationEndListener) {
                this.animationEndListener = this.renderer.listen(this.mask, 'animationend', this.destroyMask.bind(this));
            }
        }
    }

    destroyMask() {
        if (!this.mask) {
            return;
        }
        this.renderer.removeChild(this.document.body, this.mask);
        let bodyChildren = this.document.body.children;
        let hasBlockerMasks!: boolean;
        for (let i = 0; i < bodyChildren.length; i++) {
            let bodyChild = bodyChildren[i];
            if (hasClass(bodyChild, 'p-datepicker-mask-scrollblocker')) {
                hasBlockerMasks = true;
                break;
            }
        }

        if (!hasBlockerMasks) {
            unblockBodyScroll();
        }

        this.unbindAnimationEndListener();
        this.unbindMaskClickListener();
        this.mask = null;
    }

    unbindMaskClickListener() {
        if (this.maskClickListener) {
            this.maskClickListener();
            this.maskClickListener = null;
        }
    }

    unbindAnimationEndListener() {
        if (this.animationEndListener && this.mask) {
            this.animationEndListener();
            this.animationEndListener = null;
        }
    }

    writeValue(value: any): void {
        this.value = value;
        if (this.value && typeof this.value === 'string') {
            try {
                this.value = this.parseValueFromString(this.value);
            } catch {
                if (this.keepInvalid) {
                    this.value = value;
                }
            }
        }

        this.updateInputfield();
        this.updateUI();
        this.cd.markForCheck();
    }

    registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }

    getDateFormat() {
        return this.dateFormat || this.getTranslation('dateFormat');
    }

    getFirstDateOfWeek() {
        return this._firstDayOfWeek || this.getTranslation(TranslationKeys.FIRST_DAY_OF_WEEK);
    }

    // Ported from jquery-ui datepicker formatDate
    formatDate(date: any, format: any) {
        if (!date) {
            return '';
        }

        let iFormat!: any;
        const lookAhead = (match: string) => {
                const matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;
                if (matches) {
                    iFormat++;
                }
                return matches;
            },
            formatNumber = (match: string, value: any, len: any) => {
                let num = '' + value;
                if (lookAhead(match)) {
                    while (num.length < len) {
                        num = '0' + num;
                    }
                }
                return num;
            },
            formatName = (match: string, value: any, shortNames: any, longNames: any) => {
                return lookAhead(match) ? longNames[value] : shortNames[value];
            };
        let output = '';
        let literal = false;

        if (date) {
            for (iFormat = 0; iFormat < format.length; iFormat++) {
                if (literal) {
                    if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
                        literal = false;
                    } else {
                        output += format.charAt(iFormat);
                    }
                } else {
                    switch (format.charAt(iFormat)) {
                        case 'd':
                            output += formatNumber('d', date.getDate(), 2);
                            break;
                        case 'D':
                            output += formatName('D', date.getDay(), this.getTranslation(TranslationKeys.DAY_NAMES_SHORT), this.getTranslation(TranslationKeys.DAY_NAMES));
                            break;
                        case 'o':
                            output += formatNumber('o', Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000), 3);
                            break;
                        case 'm':
                            output += formatNumber('m', date.getMonth() + 1, 2);
                            break;
                        case 'M':
                            output += formatName('M', date.getMonth(), this.getTranslation(TranslationKeys.MONTH_NAMES_SHORT), this.getTranslation(TranslationKeys.MONTH_NAMES));
                            break;
                        case 'y':
                            output += lookAhead('y') ? date.getFullYear() : (date.getFullYear() % 100 < 10 ? '0' : '') + (date.getFullYear() % 100);
                            break;
                        case '@':
                            output += date.getTime();
                            break;
                        case '!':
                            output += date.getTime() * 10000 + <number>this.ticksTo1970;
                            break;
                        case "'":
                            if (lookAhead("'")) {
                                output += "'";
                            } else {
                                literal = true;
                            }
                            break;
                        default:
                            output += format.charAt(iFormat);
                    }
                }
            }
        }
        return output;
    }

    formatTime(date: any) {
        if (!date) {
            return '';
        }

        let output = '';
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();

        if (this.hourFormat == '12' && hours > 11 && hours != 12) {
            hours -= 12;
        }

        if (this.hourFormat == '12') {
            output += hours === 0 ? 12 : hours < 10 ? '0' + hours : hours;
        } else {
            output += hours < 10 ? '0' + hours : hours;
        }
        output += ':';
        output += minutes < 10 ? '0' + minutes : minutes;

        if (this.showSeconds) {
            output += ':';
            output += seconds < 10 ? '0' + seconds : seconds;
        }

        if (this.hourFormat == '12') {
            output += date.getHours() > 11 ? ' PM' : ' AM';
        }

        return output;
    }

    parseTime(value: any) {
        let tokens: string[] = value.split(':');
        let validTokenLength = this.showSeconds ? 3 : 2;

        if (tokens.length !== validTokenLength) {
            throw 'Invalid time';
        }

        let h = parseInt(tokens[0]);
        let m = parseInt(tokens[1]);
        let s = this.showSeconds ? parseInt(tokens[2]) : null;

        if (isNaN(h) || isNaN(m) || h > 23 || m > 59 || (this.hourFormat == '12' && h > 12) || (this.showSeconds && (isNaN(<any>s) || <any>s > 59))) {
            throw 'Invalid time';
        } else {
            if (this.hourFormat == '12') {
                if (h !== 12 && this.pm) {
                    h += 12;
                } else if (!this.pm && h === 12) {
                    h -= 12;
                }
            }

            return { hour: h, minute: m, second: s };
        }
    }

    // Ported from jquery-ui datepicker parseDate
    parseDate(value: any, format: any) {
        if (format == null || value == null) {
            throw 'Invalid arguments';
        }

        value = typeof value === 'object' ? value.toString() : value + '';
        if (value === '') {
            return null;
        }

        let iFormat!: any,
            dim,
            extra,
            iValue = 0,
            shortYearCutoff = typeof this.shortYearCutoff !== 'string' ? this.shortYearCutoff : (new Date().getFullYear() % 100) + parseInt(this.shortYearCutoff, 10),
            year = -1,
            month = -1,
            day = -1,
            doy = -1,
            literal = false,
            date,
            lookAhead = (match: any) => {
                let matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;
                if (matches) {
                    iFormat++;
                }
                return matches;
            },
            getNumber = (match: any) => {
                let isDoubled = lookAhead(match),
                    size = match === '@' ? 14 : match === '!' ? 20 : match === 'y' && isDoubled ? 4 : match === 'o' ? 3 : 2,
                    minSize = match === 'y' ? size : 1,
                    digits = new RegExp('^\\d{' + minSize + ',' + size + '}'),
                    num = value.substring(iValue).match(digits);
                if (!num) {
                    throw 'Missing number at position ' + iValue;
                }
                iValue += num[0].length;
                return parseInt(num[0], 10);
            },
            getName = (match: any, shortNames: any, longNames: any) => {
                let index = -1;
                let arr = lookAhead(match) ? longNames : shortNames;
                let names = [];

                for (let i = 0; i < arr.length; i++) {
                    names.push([i, arr[i]]);
                }
                names.sort((a, b) => {
                    return -(a[1].length - b[1].length);
                });

                for (let i = 0; i < names.length; i++) {
                    let name = names[i][1];
                    if (value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
                        index = names[i][0];
                        iValue += name.length;
                        break;
                    }
                }

                if (index !== -1) {
                    return index + 1;
                } else {
                    throw 'Unknown name at position ' + iValue;
                }
            },
            checkLiteral = () => {
                if (value.charAt(iValue) !== format.charAt(iFormat)) {
                    throw 'Unexpected literal at position ' + iValue;
                }
                iValue++;
            };

        if (this.view === 'month') {
            day = 1;
        }

        for (iFormat = 0; iFormat < format.length; iFormat++) {
            if (literal) {
                if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
                    literal = false;
                } else {
                    checkLiteral();
                }
            } else {
                switch (format.charAt(iFormat)) {
                    case 'd':
                        day = getNumber('d');
                        break;
                    case 'D':
                        getName('D', this.getTranslation(TranslationKeys.DAY_NAMES_SHORT), this.getTranslation(TranslationKeys.DAY_NAMES));
                        break;
                    case 'o':
                        doy = getNumber('o');
                        break;
                    case 'm':
                        month = getNumber('m');
                        break;
                    case 'M':
                        month = getName('M', this.getTranslation(TranslationKeys.MONTH_NAMES_SHORT), this.getTranslation(TranslationKeys.MONTH_NAMES));
                        break;
                    case 'y':
                        year = getNumber('y');
                        break;
                    case '@':
                        date = new Date(getNumber('@'));
                        year = date.getFullYear();
                        month = date.getMonth() + 1;
                        day = date.getDate();
                        break;
                    case '!':
                        date = new Date((getNumber('!') - <number>this.ticksTo1970) / 10000);
                        year = date.getFullYear();
                        month = date.getMonth() + 1;
                        day = date.getDate();
                        break;
                    case "'":
                        if (lookAhead("'")) {
                            checkLiteral();
                        } else {
                            literal = true;
                        }
                        break;
                    default:
                        checkLiteral();
                }
            }
        }

        if (iValue < value.length) {
            extra = value.substr(iValue);
            if (!/^\s+/.test(extra)) {
                throw 'Extra/unparsed characters found in date: ' + extra;
            }
        }

        if (year === -1) {
            year = new Date().getFullYear();
        } else if (year < 100) {
            year += new Date().getFullYear() - (new Date().getFullYear() % 100) + (year <= shortYearCutoff ? 0 : -100);
        }

        if (doy > -1) {
            month = 1;
            day = doy;
            do {
                dim = this.getDaysCountInMonth(year, month - 1);
                if (day <= dim) {
                    break;
                }
                month++;
                day -= dim;
            } while (true);
        }

        if (this.view === 'year') {
            month = month === -1 ? 1 : month;
            day = day === -1 ? 1 : day;
        }

        date = this.daylightSavingAdjust(new Date(year, month - 1, day));

        if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
            throw 'Invalid date'; // E.g. 31/02/00
        }

        return date;
    }

    daylightSavingAdjust(date: any) {
        if (!date) {
            return null;
        }

        date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);

        return date;
    }

    updateFilledState() {
        this.filled = (this.inputFieldValue && this.inputFieldValue != '') as boolean;
    }

    isValidDateForTimeConstraints(selectedDate: Date) {
        if (this.keepInvalid) {
            return true; // If we are keeping invalid dates, we don't need to check for time constraints
        }
        return (!this.minDate || selectedDate >= this.minDate) && (!this.maxDate || selectedDate <= this.maxDate);
    }

    onTodayButtonClick(event: any) {
        const date: Date = new Date();
        const dateMeta = {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear(),
            otherMonth: date.getMonth() !== this.currentMonth || date.getFullYear() !== this.currentYear,
            today: true,
            selectable: true
        };

        this.createMonths(date.getMonth(), date.getFullYear());
        this.onDateSelect(event, dateMeta);
        this.onTodayClick.emit(date);
    }

    onClearButtonClick(event: any) {
        this.updateModel(null);
        this.updateInputfield();
        this.hideOverlay();
        this.onClearClick.emit(event);
    }

    createResponsiveStyle() {
        if (this.numberOfMonths > 1 && this.responsiveOptions) {
            if (!this.responsiveStyleElement) {
                this.responsiveStyleElement = this.renderer.createElement('style');
                (<HTMLStyleElement>this.responsiveStyleElement).type = 'text/css';
                this.renderer.appendChild(this.document.body, this.responsiveStyleElement);
            }

            let innerHTML = '';
            if (this.responsiveOptions) {
                let responsiveOptions = [...this.responsiveOptions].filter((o) => !!(o.breakpoint && o.numMonths)).sort((o1: any, o2: any) => -1 * o1.breakpoint.localeCompare(o2.breakpoint, undefined, { numeric: true }));

                for (let i = 0; i < responsiveOptions.length; i++) {
                    let { breakpoint, numMonths } = responsiveOptions[i];
                    let styles = `
                        .p-datepicker[${this.attributeSelector}] .p-datepicker-group:nth-child(${numMonths}) .p-datepicker-next {
                            display: inline-flex !important;
                        }
                    `;

                    for (let j: number = <number>numMonths; j < this.numberOfMonths; j++) {
                        styles += `
                            .p-datepicker[${this.attributeSelector}] .p-datepicker-group:nth-child(${j + 1}) {
                                display: none !important;
                            }
                        `;
                    }

                    innerHTML += `
                        @media screen and (max-width: ${breakpoint}) {
                            ${styles}
                        }
                    `;
                }
            }

            (<HTMLStyleElement>this.responsiveStyleElement).innerHTML = innerHTML;
            setAttribute(this.responsiveStyleElement, 'nonce', this.config?.csp()?.nonce);
        }
    }

    destroyResponsiveStyleElement() {
        if (this.responsiveStyleElement) {
            this.responsiveStyleElement.remove();
            this.responsiveStyleElement = null;
        }
    }

    bindDocumentClickListener() {
        if (!this.documentClickListener) {
            this.zone.runOutsideAngular(() => {
                const documentTarget: any = this.el ? this.el.nativeElement.ownerDocument : this.document;

                this.documentClickListener = this.renderer.listen(documentTarget, 'mousedown', (event) => {
                    if (this.isOutsideClicked(event) && this.overlayVisible) {
                        this.zone.run(() => {
                            this.hideOverlay();
                            this.onClickOutside.emit(event);

                            this.cd.markForCheck();
                        });
                    }
                });
            });
        }
    }

    unbindDocumentClickListener() {
        if (this.documentClickListener) {
            this.documentClickListener();
            this.documentClickListener = null;
        }
    }

    bindDocumentResizeListener() {
        if (!this.documentResizeListener && !this.touchUI) {
            this.documentResizeListener = this.renderer.listen(this.window, 'resize', this.onWindowResize.bind(this));
        }
    }

    unbindDocumentResizeListener() {
        if (this.documentResizeListener) {
            this.documentResizeListener();
            this.documentResizeListener = null;
        }
    }

    bindScrollListener() {
        if (!this.scrollHandler) {
            this.scrollHandler = new ConnectedOverlayScrollHandler(this.el?.nativeElement, () => {
                if (this.overlayVisible) {
                    this.hideOverlay();
                }
            });
        }

        this.scrollHandler.bindScrollListener();
    }

    unbindScrollListener() {
        if (this.scrollHandler) {
            this.scrollHandler.unbindScrollListener();
        }
    }

    isOutsideClicked(event: Event) {
        return !(this.el.nativeElement.isSameNode(event.target) || this.isNavIconClicked(event) || this.el.nativeElement.contains(event.target) || (this.overlay && this.overlay.contains(<Node>event.target)));
    }

    isNavIconClicked(event: any) {
        return hasClass(event.target, 'p-datepicker-prev-button') || hasClass(event.target, 'p-datepicker-prev-icon') || hasClass(event.target, 'p-datepicker-next-button') || hasClass(event.target, 'p-datepicker-next-icon');
    }

    onWindowResize() {
        if (this.overlayVisible && !isTouchDevice()) {
            this.hideOverlay();
        }
    }

    onOverlayHide() {
        this.currentView = this.view;

        if (this.mask) {
            this.destroyMask();
        }

        this.unbindDocumentClickListener();
        this.unbindDocumentResizeListener();
        this.unbindScrollListener();
        this.overlay = null;
    }

    ngOnDestroy() {
        if (this.scrollHandler) {
            this.scrollHandler.destroy();
            this.scrollHandler = null;
        }

        if (this.translationSubscription) {
            this.translationSubscription.unsubscribe();
        }

        if (this.overlay && this.autoZIndex) {
            ZIndexUtils.clear(this.overlay);
        }

        this.destroyResponsiveStyleElement();
        this.clearTimePickerTimer();
        this.restoreOverlayAppend();
        this.onOverlayHide();

        super.ngOnDestroy();
    }
}

@NgModule({
    imports: [DatePicker, SharedModule],
    exports: [DatePicker, SharedModule]
})
export class DatePickerModule {}
