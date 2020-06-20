import {Component, OnInit} from '@angular/core';
import {ModalDismissReasons, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from './toast-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'cuckoo-hashing';
  nTables = 3;
  nRows = 10;
  currentValue;

  buttonValid = false;
  currentCollisionCount = 0;
  currentOperations = [];

  tables = [];
  maxCycle = 100;

  borderInitial = '1px solid #dee2e6';
  borderRed = '2px solid #dc3545';
  borderGreen = '2px solid #28a745';
  borderInfo = '2px solid #17a2b8';

  constructor(public toastService: ToastService) {
  }

  ngOnInit(): void {
    this.checkInputs();
    this.reload();
  }

  // recreates tables empty
  reload() {
    console.log('Tables refreshed ' + this.nTables + ', ' + this.nRows);
    this.currentCollisionCount = 0;

    this.tables = [];
    for (let i = 0; i < this.nTables; i++) {
      const table = {
        rows: [],
        loadFactor: ('0/' + this.nRows)
      };
      for (let j = 0; j < this.nRows; j++) {
        const object = {value: '-', css: this.borderInitial};
        table.rows.push(object);
      }
      this.tables.push(table);
    }
    console.log(this.tables);
  }

  // checks is input valid 2<=tables<=5 and 10<=rows<=30
  checkInputs() {
    this.buttonValid = this.nTables !== undefined && this.nRows !== undefined
      && Number.isInteger(this.nTables) && Number.isInteger(this.nRows)
      && 2 <= this.nTables && this.nTables <= 5
      && 10 <= this.nRows && this.nRows <= 30;
  }

  // makes styles of each item initial
  refreshStyle() {
    for (let i = 0; i < this.nTables; i++) {
      for (let j = 0; j < this.nRows; j++) {
        this.tables[i].rows[j].css = this.borderInitial;
      }
    }
  }

  // Cuckoo Hashing Functions
  // ((indexTable + 1)^2 + valueScore) % nRows
  cuckooHash(value, indexTable) {
    // console.log(value, indexTable);
    if (0 <= indexTable && indexTable <= 4) {
      let valueScore = 0;
      for (let i = 0; i < value.length; i++) {
        valueScore += value.charCodeAt(i) + (indexTable + 1) ** i;
      }
      return (((indexTable + 1) ** 2) + valueScore) % this.nRows;
    } else {
      return -1;
    }
  }

  // marks proper rows borders according to entered value
  fitValue() {
    this.refreshStyle();
    for (let i = 0; i < this.nTables; i++) {
      const indexRow = this.cuckooHash(this.currentValue, i);
      this.tables[i].rows[indexRow].css = this.borderInfo;
    }
  }

  // searches entered value in current tables
  searchValue(value) {
    this.refreshStyle();
    for (let i = 0; i < this.nTables; i++) {
      const indexRow = this.cuckooHash(value, i);
      if (indexRow === -1) {
        console.log('error on hashing');
        this.showDanger('error on hashing');
      }
      this.tables[i].rows[indexRow].css = this.borderRed;
      if (this.tables[i].rows[indexRow].value === value) {
        this.tables[i].rows[indexRow].css = this.borderGreen;
        // console.log(i, indexRow);
      }
    }
  }

  // deletes value if exists in tables
  deleteValue(value) {
    this.refreshStyle();
    for (let i = 0; i < this.nTables; i++) {
      const indexRow = this.cuckooHash(value, i);
      if (indexRow === -1) {
        console.log('error on hashing');
        this.showDanger('error on hashing');
      }
      this.tables[i].rows[indexRow].css = this.borderRed;
      if (this.tables[i].rows[indexRow].value === value) {
        this.tables[i].rows[indexRow].css = this.borderGreen;
        this.tables[i].rows[indexRow].value = '-';
        console.log('deleted', value, i, indexRow);
        this.showSuccess('Deleted: ' + value);
      }
    }
    this.updateLoadFactor();
  }

  // updates load factor
  updateLoadFactor() {
    for (let i = 0; i < this.nTables; i++) {
      let loadCount = 0;
      for (let j = 0; j < this.nRows; j++) {
        if (this.tables[i].rows[j].value !== '-') {
          loadCount++;
        }
      }
      this.tables[i].loadFactor = loadCount + '/' + this.nRows;
    }
  }

  // searches given value in tables, if finds, returns index of table
  search(value) {
    for (let i = 0; i < this.nTables; i++) {
      const indexRow = this.cuckooHash(value, i);
      if (indexRow === -1) {
        return -1;
      }
      if (this.tables[i].rows[indexRow].value === value) {
        // console.log(i, indexRow);
        return i;
      }
    }
    return -1;
  }

  // inserts entered value
  insertValue(value, indexTable, collisionCount) {
    this.refreshStyle();

    // initial values
    if (collisionCount === 0) {

      // check validity of current value
      if (value === undefined){
        this.showDanger('Value cannot be empty!');
        return;
      }
      value = value.trim();
      if (value === '' || value === '-') {
        this.showDanger('Value cannot be empty!');
        return;
      }

      this.currentValue = '';
      this.currentCollisionCount = 0;
      this.currentOperations = [];
    }

    // if same value added to same table, there is a cycle. Must rehash!
    if (this.currentOperations.indexOf(indexTable + '-' + value) !== -1) {
      this.showDanger('Cycle present! Must rehash!');
      return;
    }

    const index = this.search(value);
    if (index !== -1) {
      console.log('Value has already added');
      this.showDanger('Value has already added: ' + value);
      return;
    } else {
      // find proper row on current table
      const indexRow = this.cuckooHash(value, indexTable);
      const previousValue = this.tables[indexTable].rows[indexRow].value;
      this.tables[indexTable].rows[indexRow].value = value;

      // add operation to operations list
      this.currentOperations.push(indexTable + '-' + value);

      if (previousValue !== '-') {
        // try to add previous value to next table
        setTimeout(() => {
          this.insertValue(previousValue, ((indexTable + 1) % this.nTables), collisionCount + 1);
        }, 50);
      }
    }

    // update collision count
    if (this.currentCollisionCount < collisionCount) {
      this.currentCollisionCount = collisionCount;
    }

    // show toast
    if (collisionCount === 0) {
      this.showSuccess('Value successfully inserted: ' + value);
    }
    this.updateLoadFactor();
  }

  // shows a success toast left upper of screen
  showSuccess(text) {
    this.toastService.show(text, {classname: 'bg-success text-light', delay: 10000});
  }

  // shows a danger toast left upper of screen
  showDanger(text) {
    this.toastService.show(text, {classname: 'bg-danger text-light', delay: 10000});
  }

}
