import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Input,
  OnDestroy,
  Optional,
  QueryList,
  Self
} from '@angular/core';

import {
  NgControl
} from '@angular/forms';

import {
  Subject
} from 'rxjs';

import {
  takeUntil
} from 'rxjs/operators';

import {
  SkyFormsUtility
} from '../shared/forms-utility';

import {
  SkyRadioChange
} from './types/radio-change';

import {
  SkyRadioComponent
} from './radio.component';

let nextUniqueId = 0;

@Component({
  selector: 'sky-radio-group',
  templateUrl: './radio-group.component.html'
})
export class SkyRadioGroupComponent implements AfterContentInit, AfterViewInit, OnDestroy {

/**
 * Sets the radio button group's `aria-labelledby` attribute to support 
 * [accessibility](https://developer.blackbaud.com/skyux/components/radio#accessibility). The value
 * should be the HTML element ID (without the leading #) of the element that labels the radio
 * button group. If the radio button group does not include a visible label on the screen, use the `ariaLabel` property instead.
 */
  @Input()
  public ariaLabelledBy: string;

/**
 * Defines a string value to label the radio button group and set the `aria-label` attribute to
 * support [accessibility](https://developer.blackbaud.com/skyux/components/radio#accessibility).
 * If the radio button group includes a visible label on the screen, use the `ariaLabelledBy` property instead.
 */
  @Input()
  public ariaLabel: string;

  /**
   * Indicates whether to disable the input.
   * @default "false"
   */
  @Input()
  public set disabled(value: boolean) {
    const newDisabledState = SkyFormsUtility.coerceBooleanProperty(value);
    if (this._disabled !== newDisabledState) {
      this._disabled = newDisabledState;
      this.updateRadioButtonDisabled();
    }
  }

  public get disabled(): boolean {
    return this._disabled;
  }
/**
 * Specifies a name for the collection of radio buttons that the component groups together.
 * This property overwrites the deprecated `name` property on individual `sky-radio` elements,
 * and it is required unless the `name` property is set on individual `sky-radio` elements.
 * @required
 */
  @Input()
  public set name(value: string) {
    this._name = value;
    this.updateRadioButtonNames();
  }
  public get name(): string {
    return this._name;
  }

  /**
   * Indicates whether the input is required for form validation.
   * When you set this property to `true`, the component adds `aria-required` and `required`
   * attributes to the input element so that forms display an invalid state until the input element
   * is complete.
   * @default "false"
   */
  @Input()
  public required: boolean = false;

/**
 * Specifies the value of the radio button to select by default when the group loads.
 * The value corresponds to the `value` property of an individual `sky-radio` element within the group.
 */
  @Input()
  public set value(value: any) {
    const isNewValue = value !== this._value;

    if (isNewValue) {
      this._value = value;
      this.onChange(this._value);
      this.updateCheckedRadioFromValue();
    }
  }
  public get value(): any {
    return this._value;
  }

/**
 * Specifies an index for all the radio buttons in the group. If the index is not defined,
 * the indices for individual radio buttons are set to their positions on load.
 * This property supports [accessibility](https://developer.blackbaud.com/skyux/components/radio#accessibility) by ensuring that focus is placed on the currently selected radio button or 
 * on the first or last button when no radio button is selected depending on how users navigate to the radio button group.
 */
  @Input()
  public set tabIndex(value: number) {
    if (this._tabIndex !== value) {
      this._tabIndex = value;
      this.updateRadioButtonTabIndexes();
    }
  }
  public get tabIndex(): number {
    return this._tabIndex;
  }

  @ContentChildren(SkyRadioComponent, { descendants: true })
  private radios: QueryList<SkyRadioComponent>;

  private ngUnsubscribe = new Subject();

  private _disabled: boolean = false;

  private _name = `sky-radio-group-${nextUniqueId++}`;

  private _tabIndex: number;

  private _value: any;

  constructor(
    private changeDetector: ChangeDetectorRef,
    @Self() @Optional() private ngControl: NgControl
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  public ngAfterContentInit(): void {
    this.resetRadioButtons();

    // Watch for radio selections.
    this.watchForSelections();

    this.radios.changes
      .pipe(
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(() => {
        this.resetRadioButtons();

        // Subscribe to the new radio buttons
        this.watchForSelections();
      });
  }

  public ngAfterViewInit(): void {
    if (this.ngControl) {
      // Backwards compatibility support for anyone still using Validators.Required.
      this.required = this.required || SkyFormsUtility.hasRequiredValidation(this.ngControl);

      // Avoid an ExpressionChangedAfterItHasBeenCheckedError.
      this.changeDetector.detectChanges();
    }
  }

  public watchForSelections() {
    this.radios.forEach((radio) => {
      radio.change
        .pipe(
          takeUntil(this.ngUnsubscribe)
        )
        .subscribe((change: SkyRadioChange) => {
          this.onTouched();
          this.writeValue(change.value);
        });
    });
  }

  public ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public writeValue(value: any): void {
    this.value = value;
  }

  /**
   * @internal
   * Indicates whether to disable the control. Implemented as a part of ControlValueAccessor.
   */
  public setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  public registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /* istanbul ignore next */
  private onChange: (value: any) => void = () => {};
  /* istanbul ignore next */
  private onTouched: () => any = () => {};

  private updateRadioButtonDisabled(): void {
    if (this.radios) {
      this.radios.forEach(radio => {
        radio.disabled = this.disabled;
      });
    }
  }

  private updateRadioButtonNames(): void {
    if (this.radios) {
      this.radios.forEach(radio => {
        radio.name = this.name;
      });
    }
  }

  private updateRadioButtonTabIndexes(): void {
    if (this.radios) {
      this.radios.forEach(radio => {
        radio.groupTabIndex = this.tabIndex;
      });
    }
  }

  private updateCheckedRadioFromValue(): void {
    if (!this.radios) {
      return;
    }

    this.radios.forEach((radio) => {
      radio.checked = (this._value === radio.value);
    });
  }

  private resetRadioButtons(): void {
    this.updateCheckedRadioFromValue();
    this.updateRadioButtonNames();
    this.updateRadioButtonTabIndexes();
  }
}
