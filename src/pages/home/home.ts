import {Component, NgZone, OnInit} from '@angular/core';
import {NavController, Platform} from 'ionic-angular';
import {mkad_coords} from "../../Model/MkadCoords";
import {Tonnage} from "../../Model/Tonnage";

declare let ymaps: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {

  map;
  mapHeight: number;
  searchControl;
  distance: number;
  lt = 55.752797;
  lg = 37.622324;
  isButtondisabled: boolean;
  tonnages = [
    new Tonnage(1.5, 3500, 20),
    new Tonnage(5, 4000, 23),
    new Tonnage(10, 7000, 28),
    new Tonnage(20, 10000, 35)
  ];
  selectedTonnage: Tonnage;
  totalCost: number;
  enteredTonnage: number;

  constructor(public navCtrl: NavController,
              private ngZone: NgZone,
              platform: Platform) {
    this.mapHeight = platform.height() / 2;
    console.log(this.mapHeight);
  }

  ngOnInit(): void {
    ymaps.ready().then(() => {
      this.map = new ymaps.Map('map', {
        center: [this.lt, this.lg],
        zoom: 7,
        controls: ['searchControl', 'zoomControl', 'geolocationControl']
      });
      this.searchControl = this.map.controls.get('searchControl');
      this.searchControl.options.set({noPlacemark: false});

    });
  }

  getDistance() {
    let arPlacemarks = [];
    for (let i = 0; i < mkad_coords[0].length; i++)
      arPlacemarks[i] = new ymaps.Placemark(mkad_coords[0][i]);
    //к сожалению для корректного поиска ближайшей точки их все надо добавить
    //но мы их не будем отображать конечно же
    let arPlacemarksRez = ymaps.geoQuery(arPlacemarks).addToMap(this.map).setOptions('visible', false);
    //вместо этого нарисуем полигон мкада. для красоты. он для расчётов нам не нужен
    // let mkad_polygon = new ymaps.Polygon(this.mkad_coords);
    // ymaps.geoQuery(mkad_polygon).addToMap(this.map);

    this.searchControl.getResult(0).then(res => {
        let needed_point, obj_collection;
        // if (needed_point)
        //   obj_collection.removeFromMap(this.map);

        let coords = res.geometry.getCoordinates();
        needed_point = new ymaps.Placemark(coords, {}, {preset: 'islands#blueStretchyIcon', draggable: false});
        // obj_collection = ymaps.geoQuery(needed_point).addToMap(map);

        //находим ближайшую точку мкада
        let closestObject = arPlacemarksRez.getClosestTo(coords);

        ymaps.route([
          closestObject.geometry.getCoordinates(),
          coords
        ]).then(route => {
            this.ngZone.run(() => {
              this.map.geoObjects.removeAll();
              this.map.geoObjects.add(route);
              this.distance = Math.round(route.getLength() / 1000);
              console.log(this.distance);
              this.map.setCenter([55.752797, 37.622324], 7);
              needed_point.properties.set({iconContent: this.distance + ' км'});
              this.searchControl.clear();
              this.map.geoObjects.add(needed_point);
            });
          }
        );
      }
    );
  }

  calc() {
    console.log(this.selectedTonnage);
    this.totalCost = this.selectedTonnage.minimalPrice + (2 * this.selectedTonnage.pricePerKm * this.distance);
  }

  selectTonnage() {
    this.selectedTonnage = this.tonnages.find(tonnage => {
      return tonnage.tonnage >= this.enteredTonnage;
    })
  }
}
