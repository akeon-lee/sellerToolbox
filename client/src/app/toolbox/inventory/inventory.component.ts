import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm, FormGroup, Validators, FormBuilder, FormArray } from '@angular/forms';

import { ToolboxService } from '../toolbox.service';
import { AuthService } from '../../auth/auth.service';
import { ProductGroupRow, InventoryGroupRow } from '../../shared/general.models';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit, OnDestroy {
  editModeOff: boolean = true;
  updateProductsForm: FormGroup;
  inventory: Array<InventoryGroupRow>;
  selectedRows: Array<ProductGroupRow> = [];
  tag: HTMLCollection | NodeListOf<HTMLTableRowElement> = document.getElementsByTagName('tr');

  // User
  user: object; // Change the type later.

  constructor(
    private toolboxService: ToolboxService,
    private _fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Get the user information for address.
    this.authService.getProfile()
      .subscribe((user) => {
          this.user = user;
        },
        err => console.log(err));
    // Getting the products from the database.
    this.toolboxService.getProducts()
      .subscribe((inventory) => {
          this.inventory = inventory;
          this.initForm();
        },
        err => console.log(err));
  }

  initForm() {
    // Initialize the form.
    this.updateProductsForm = this._fb.group({
      // Array is empty in the beginning.
      'products': this._fb.array([])
    });
    const control = <FormArray>this.updateProductsForm.controls['products'];
    // Initialize product rows with the items/data from the database.
    for(const item of this.inventory) {
      const data = this._fb.group({
        'id': [{value: item._id, disabled: true}],
        'images': [{value: item.images, disabled: true}],
        'sku': [{value: item.sku, disabled: true}],
        'title': [{value: item.title, disabled: true}],
        'quantity': this._fb.group({
          'quantity': [{value: item.quantity.quantity, disabled: true}],
          'availableQuantity': [{value: item.quantity.availableQuantity, disabled: true}],
          'alertQuantity': [{value: item.quantity.alertQuantity, disabled: true}],
          'pendingOrders': [{value: item.quantity.pendingOrders, disabled: true}],
          'neededQuantity': [{value: item.quantity.neededQuantity, disabled: true}]
        }),
        'description': [{value: item.description, disabled: true}],
        'price': this._fb.group({
          'purchasePrice': [{value: item.price.purchasePrice, disabled: true}],
          'stockValue': [{value: item.price.stockValue, disabled: true}],
        }),
        'category': [{value: item.category, disabled: true}],
        'variationGroup': [{value: item.variationGroup, disabled: true}],
        'upc': [{value: item.upc, disabled: true}],
        'barcode': [{value: item.barcode, disabled: true}],
        'condition': [{value: item.condition, disabled: true}],
        'location': [{value: item.location, disabled: true}],
        //   'fullAddress': [{value: item.location.fullAddress, disabled: true}],
        //   'company': [{value: item.location.company, disabled: true}],
        //   'name': [{value: item.location.name, disabled: true}],
        //   'address1': [{value: item.location.address1, disabled: true}],
        //   'address2': [{value: item.location.address2, disabled: true}],
        //   'city': [{value: item.location.city, disabled: true}],
        //   'state': [{value: item.location.state, disabled: true}],
        //   'zip': [{value: item.location.zip, disabled: true}],
        //   'country': [{value: item.location.country, disabled: true}],
        //   'email': [{value: item.location.email, disabled: true}],
        //   'phone': [{value: item.location.phone, disabled: true}]
        // }),
        'detail': this._fb.group({
          'weight': [{value: item.detail.weight, disabled: true}],
          'height': [{value: item.detail.height, disabled: true}],
          'width': [{value: item.detail.width, disabled: true}],
          'depth': [{value: item.detail.depth, disabled: true}]
        }),
        'binLocation': [{value: item.binLocation, disabled: true}],
        'monitor': [{value: item.monitor, disabled: true}],
        'modifiedDate': [{value: item.modifiedDate, disabled: true}]
      });
      // Push to the empty array, above.
      control.push(data);
    }
  }
  
  onSearchInventory(form: NgForm) {
    if(this.editModeOff) {
      this.initForm();
      const value = form.value;
      const regex = new RegExp(value.search, 'i');
      
      // Get the search value, turn it into a string and then split each word seperated by spaces into an array.
      const filterWords: Array<string> = value.search.match(regex).join().split(/\s+/);
      const control = <FormArray>this.updateProductsForm.controls['products'];
  
      filterWords.forEach((word) => { // This loop marks each row by adding a 'keep' property to the rows that should be kept
        const searchWord = new RegExp(word, 'i');
  
        control.value.forEach((row) => {
          if(row.title.match(searchWord)) {
            // keepIndex = control.value.indexOf(row);
            row['keep'] = true;
          };
        });
      });
      
      control.value.forEach((row) => { // This loops searches each row and removes the row that doesn't have the 'keep' property.
        if(!row['keep']) {
          const index = control.value.indexOf(row);
          control.removeAt(index);
        }
      });
    }
  }

  onSyncInventory() {
    this.toolboxService.syncInventory()
      .subscribe((updates) => {
        console.log(updates);
        this.ngOnInit();
      },
      err => console.log(err));
  }

  onEditItems() {
    this.editModeOff = !this.editModeOff;
    // When edit mode is turned off resetToDefault().
    if(this.editModeOff) {
      this.resetToDefault();
    }
    // Controls enable/disable input.
    const control = this.updateProductsForm.controls['products'];
    control.disabled ? control.enable() : control.disable();
  }

  onUpdateItems() {
    // console.log(this.updateProductsForm);
    const productsDetail = this.updateProductsForm.value.products;
    
    this.toolboxService.updateItems(productsDetail)
      .subscribe((updated) => {
        console.log(updated);
        this.editModeOff = !this.editModeOff;
        // Controls enable/disable input.
        const control = this.updateProductsForm.controls['products'];
        control.disabled ? control.enable() : control.disable();
        this.ngOnInit();
      });
  };

  onSelectItem(rowIndex: number) {
    
    // Only select if edit mode is on.
    if(this.editModeOff !== true) {
      const control = <FormArray>this.updateProductsForm.controls['products'];

      // If row is selected, highlight the row.
      // Add one to the index in order for it to highlight the currently selected row.
      if(this.tag[rowIndex + 1]['selected'] === 'yes') {
        this.tag[rowIndex + 1].setAttribute('style', '');
        this.tag[rowIndex + 1]['selected'] = 'no';
      } else {
        this.tag[rowIndex + 1].setAttribute('style', 'background-color: rgba(255, 255, 255, 0.3);');
        this.tag[rowIndex + 1]['selected'] = 'yes';
      }

      // Select the product row by selecting the controls row index.
      this.selectedRows.push(control.controls[rowIndex]);

    }

  }

  // Delete a single item
  onDeleteSingleItems(rowIndex: number) {
    // Remove a product row
    const control = <FormArray>this.updateProductsForm.controls['products'];
    const item = control.value[rowIndex].id;

    const dblCheck = confirm('Are you sure you want to delete this item?');
    if(dblCheck) {
      // Remove from the client.
      control.removeAt(rowIndex);
      // Call toolbox service to delete item from the database.
      this.toolboxService.deleteItems(item)
        .subscribe((deleted) => {
          console.log(deleted);
          this.ngOnInit();
        });
    } else {
      return false;
    }
  }

  // Deleting multiple items
  onDeleteMultiItems() {
    if(!this.editModeOff) {
      // Confirm to delete items
      const dblCheck = confirm('Are you sure you want to delete these items?');
      if(dblCheck) {
        // Collect the ids of each row that are selected
        const rowIds = [];
        // Get the array of values (all the products rows in one array). Compare the [selectedRows] with all the values in the array and remove if value[i].id matches.
        const control = <FormArray>this.updateProductsForm.controls['products'];
        for(const item of this.selectedRows) {
          for(const row of control.value) {
            // Check to see if the selected row item matches the row from the entire array of rows.
            if(item.value.id === row.id) {
              // Get the index of the matching id rows that were selected.
              const index = control.value.indexOf(row);
              rowIds.push(row.id);
              control.removeAt(index);
            };
          };
        };
        // Call toolbox service to delete item from the database.
        this.toolboxService.deleteItems(rowIds)
          .subscribe((deleted) => {
            console.log(deleted);
            this.editModeOff = true;
            this.ngOnInit();
          });
      } else {
        return false;
      };
    };
  };

  // Import inventory from Woocommerce
  onImportWooInv() {
    const dblCheck = confirm('Are you sure you want to import the items from Woocommerce?');
    if(dblCheck) {
      this.toolboxService.importWooInv()
        .subscribe((res) => {
          console.log(res);
          this.ngOnInit();
        });
    } else {
      return false;
    };
  };

  resetToDefault(rowIndex?: number) {
    this.editModeOff = true;
    this.selectedRows = [];
    for(let i = 0; i < this.tag.length; i++) {
      this.tag[i].setAttribute('style', '');
      this.tag[i]['selected'] = 'no';
    };
  };

  ngOnDestroy() {
    // console.log('destroyed');
    this.resetToDefault();
  };

}
