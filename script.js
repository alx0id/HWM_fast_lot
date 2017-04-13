// ==UserScript==
// @name         HWM_fast_lot
// @namespace    http://heroeswm.ru/
// @version      0.1
// @description  Fast lot
// @author       alx0id
// @match        http://www.heroeswm.ru/auction_new_lot.php
// @grant        none
// ==/UserScript==

/*global console, XPathResult, StopIteration, GM_xmlhttpRequest, DOMParser */
/*jslint plusplus: true */
/*jslint continue: true */

var i;
var elem_form, el_label, el, images, elem_item, elem_count, elem_duration, elem_price, temp;
var fastLots = [],
    lot = {},
    elem_form,
    urls = [],
    images = [],
    cur_lot;

GM_xmlhttpRequest = function (obj) {
    "use strict";
    var request = new XMLHttpRequest(), name;
    request.onreadystatechange = function () { if (obj.onreadystatechange) { obj.onreadystatechange(request); } if (request.readyState === 4 && obj.onload) { obj.onload(request); } };
    request.onerror = function () { if (obj.onerror) { obj.onerror(request); } };
    try { request.open(obj.method, obj.url, true); } catch (e) { if (obj.onerror) { obj.onerror({readyState: 4, responseHeaders: '', responseText: '', responseXML: '', status: 403, statusText: 'Forbidden'}); } return; }
    if (obj.headers) { for (name in obj.headers) { request.setRequestHeader(name, obj.headers[name]); } }
    request.send(obj.data);
    return request;
};

function getUniqueElementByXPath(XPath) {
    "use strict";
	return document.evaluate(XPath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
}

function setMarketDivInner(response, item_to_fill) {
    "use strict";
    if (response.status !== 200) {
        return 0;
    }

    // Ини @reg
    var parser = new DOMParser(),
        doc = parser.parseFromString(response.responseText, "text/html"),
        elem_tr,
        tr,
        tbody,
        arr,
        check,
        market_div,
        image_el,
        image_a,
        table_innerHTML,
        table_el,
        first_price = 0,
        marg_div,
        margin,
        curPrice,
        strDur,
        minDur,
        maxDur,
        elem_price,
        outPrice,
        colouredTD;
    // !reg
 
    elem_tr = doc.evaluate("//TBODY/TR[1][@bgcolor='#eeeeee']", doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

    tr = elem_tr.snapshotItem(0);

    tbody = tr.parentNode;

    arr = [];
    
    for (i = 2; i < tbody.childNodes.length; i++) {

        var row = {};
                 
        tr = tbody.childNodes[i];

        check = tr.childNodes[2].firstChild.firstChild;
        if (check.childNodes.length > 1) {
            continue;
        }

        lot = tr.firstChild.childNodes[1].firstChild.firstChild.firstChild.firstChild.title;
        row.lotName = tr.firstChild.firstChild.name;
        row.count = tr.firstChild.childNodes[1].firstChild.firstChild.childNodes[1].childNodes[4].innerText;
        row.price = tr.childNodes[2].firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.childNodes[1].innerText;
        row.price = row.price.replace(/\,/ig, '');

        row.myLot = tr.innerText.indexOf('AlX0id') > -1;

        strDur = tr.firstChild.childNodes[1].firstChild.firstChild.childNodes[1].childNodes[4].data;
        if (strDur) {
            row.durability = strDur.replace(/Прочность: /, "");
            minDur = parseInt(row.durability.replace(/\/.*/, ''));
            maxDur = parseInt(row.durability.replace(/.*\//, ''));
        }

        row.av_price = Math.floor(row.price / minDur);
        if (item_to_fill.repair) {
            row.optislom = calc(parseInt(row.price), minDur, maxDur, item_to_fill.repair);
        }

        if (first_price === 0) {
            first_price = row.price;
        }
        arr.push(row); // 010014
    }
    
    market_div = document.getElementById("market_div");
    
    market_div.innerHTML = "";
    
    image_a = document.createElement('a');
    image_a.href = "http://www.heroeswm.ru/auction.php?" + urls[item_to_fill.value];
    
    image_el = document.createElement('img');
    image_el.src = images[item_to_fill.value];
    
    image_a.appendChild(image_el);
    market_div.appendChild(image_a);
    
    table_el = document.createElement('table');
    
    table_innerHTML = "<tbody></tbody>";
    for (i = 0; i < arr.length; i++) {

        if (arr[i].myLot) {
            table_innerHTML += "<tr bgcolor=\"#0000FF\" color='white'>";
            colouredTD = "<td style='color: white;'>";
        } else {
            table_innerHTML += "<tr>";
            colouredTD = "<td>";
        }
        
        outPrice = arr[i].optislom ? arr[i].optislom.optimalPrice : arr[i].av_price;
        
        table_innerHTML += colouredTD + "<b>" + arr[i].price + "</b></td>" +
            colouredTD + arr[i].durability + "</td>" +
            "<td bgcolor=\"#CCCCFF\">" + outPrice + "</td>" +
            colouredTD + arr[i].count + "</td>";
        table_innerHTML += "</tr>";
    }
    table_el.innerHTML = table_innerHTML;
    market_div.appendChild(table_el);
    
    marg_div = document.getElementById('marg_div');
    if (marg_div) {
        marg_div.innerHTML = "&nbsp;&nbsp;";
    }
    if ((first_price !== 0) && (first_price - 3 >= 1.01 * 3000)) {
        elem_price = getUniqueElementByXPath("//input[@name='price']");
		if (elem_price) {
			elem_price.value = first_price - 3;
            curPrice = elem_price.value;
            
            marg_div = document.getElementById('marg_div');
            margin = Math.floor(curPrice * 0.99 - item_to_fill.price);
            if (margin > 0) {
                marg_div.style.backgroundColor = 'blue';
                marg_div.style.color = 'white';
            } else {
                marg_div.style.backgroundColor = 'red';
            }
            marg_div.innerHTML = "&nbsp;&nbsp;" + margin;
		}
    }
}

function appendMarketDiv(item_to_fill) {
    "use strict";
    var market_div;
    market_div = document.getElementById('market_div');
    if (!market_div) {
        market_div = document.createElement('div');
        market_div.className = 'market_div';
        market_div.id = 'market_div';
        market_div.style.backgroundColor = 'gainsboro';
        market_div.style.position = 'absolute';
        market_div.style.left = '85%';
        market_div.style.width = '10%';
        market_div.style.top = '0%';
        market_div.innerHTML = "Здесь будет щастье";
        document.body.appendChild(market_div);

    }
    
    GM_xmlhttpRequest({
		method: "GET",
		url: "http://www.heroeswm.ru/auction.php?" + urls[item_to_fill.value],
		headers:
            {
			    'Content-Type'		: 'text/html' //,
			//'Referer'			: "http://www.heroeswm.ru/auction.php",
            },
		//data: urls[item_to_fill.value],
		onload: function (res) {
			setMarketDivInner(res, item_to_fill);
		}
	});
}

function appendPriceDiv(item_to_fill) {
    "use strict";
    var price_div, marg_div, margin, curPrice, elem_price;
    price_div = document.getElementById('price_div');
    marg_div = document.getElementById('marg_div');
    elem_price = getUniqueElementByXPath("//input[@name='price']");
    if (!price_div) {
		console.log(elem_price);
		if (elem_price) {
            
            price_div = document.createElement('b');
            price_div.className = 'price_div';
            price_div.id = 'price_div';
            price_div.style.backgroundColor = 'gainsboro';
            
            marg_div = document.createElement('i');
            marg_div.className = 'marg_div';
            marg_div.id = 'marg_div';
            elem_price.parentNode.insertBefore(marg_div, elem_price.nextSibling);
            elem_price.parentNode.insertBefore(price_div, elem_price.nextSibling);
		}
    }
    price_div.innerHTML = item_to_fill.price;
}

function set_selected_lot(item_to_fill) {
    "use strict";
    el_label = document.getElementById(item_to_fill.value);
    if (el_label) {
        el_label.firstChild.className = "selected_lot";
    }
}

function getCallBack(item_to_fill) {
    "use strict";
    return function () {
        elem_item = getUniqueElementByXPath("//select[@name='item']");
        elem_item.selectedIndex = -1;
		//console.log(item_to_fill);
		//console.log(elem_item);
		var opt = 0, matchArr;
		for (i = 0; i < elem_item.childNodes.length; i++) {
			//console.log(elem_item.childNodes[i]);
			if (!elem_item.childNodes[i].innerText) {
				continue;
			}
			//console.log(elem_item.childNodes[i].innerText.indexOf(item_to_fill.value));
			if (elem_item.childNodes[i].innerText.indexOf(item_to_fill.value) === 0) {
                
                matchArr = /(\d*)\/(\d*)/.exec(elem_item.childNodes[i].innerText);
                
                if (!matchArr || matchArr[1] === matchArr[2]) {
                    console.log(elem_item.childNodes[i]);
                    console.log(opt);
                    elem_item.selectedIndex = opt;
                    break;
                }
			}
			opt++;
		}

        elem_count = getUniqueElementByXPath("//input[@name='count']");
		console.log(elem_count);
		if (elem_count) {
            elem_count.value = Math.min(item_to_fill.amount, item_to_fill.quantity);
            elem_count.value = Math.max(elem_count.value, 1);
		}
        
		elem_price = getUniqueElementByXPath("//input[@name='price']");
		console.log(elem_price);
		if (elem_price) {
			elem_price.value = item_to_fill.price;
		}
		
		elem_duration = getUniqueElementByXPath("//select[@name='duration']");
		elem_duration.selectedIndex = item_to_fill.duration;

        appendMarketDiv(item_to_fill);
        appendPriceDiv(item_to_fill);
        
        set_selected_lot(item_to_fill);
        
        elem_price.focus();
        elem_price.select();
    };
}

function getQuantity(name, defQuantity) {
    "use strict";
    var elem_option = getUniqueElementByXPath("//option[starts-with(text(), '" + name + "')]"),
        regx = new RegExp(name + " \\((\\d*)\\)", 'ig'),
        res;
    
	if (elem_option) {
        res = regx.exec(elem_option.innerHTML);
        if (res) {
            return res[1];
        } else {
            return 0;
        }
	} else {
        return 0;
    }
}

function addFastLot(fastLot) {
    "use strict";
    if (elem_form) {
        el_label = document.createElement('label');
        
        el_label.id = fastLot.value;
	
        el_label.width = 25;
        el_label.height = 25;

        el = document.createElement('img');
        el.src = images[fastLot.value];
        el.width = 25;
        el.height = 25;

        el_label.appendChild(el);
        el_label.innerHTML += fastLot.quantity;

        var myCallback = getCallBack(fastLot);
        el_label.addEventListener("click", myCallback, false);
        elem_form.insertBefore(el_label, elem_form.childNodes[1]);
    }
}

function calc(price, currentDurability, maxDurability, repairPrice) {
    
    "use strict";
    var currentMaxDurability, totalCost = 0, totalBattles = 0, stepNum = 0, optimalPrice = 999999, optimalCurrentDurability, optimalMaxDurability, optimalBattlesCount, res;
       
    res = {};
    res.optimalPrice                = 0;
    res.optimalCurrentDurability    = 0;
    res.optimalMaxDurability        = 0;
    res.optimalBattlesCount         = 0;
    
    currentMaxDurability = maxDurability;
    
    totalCost += price;
    
    totalBattles += currentDurability;
    
    optimalCurrentDurability    = 0;
    optimalMaxDurability        = currentMaxDurability;
    optimalBattlesCount         = totalBattles;
    
    if (totalBattles > 0) {
        optimalPrice = Math.round(totalCost / totalBattles);
    }
    
    while (currentMaxDurability > 0) {
        
        totalCost += repairPrice;

        currentDurability   = Math.floor(currentMaxDurability * 0.9);
        totalBattles        += currentDurability;
        currentMaxDurability--;
        
        if (optimalPrice >= Math.round(totalCost / totalBattles)) {
            optimalPrice            = Math.round(totalCost / totalBattles);
            optimalBattlesCount     = totalBattles;
            optimalMaxDurability    = currentMaxDurability;
        }
        
        stepNum++;
        
    }
    
    res.optimalPrice                = optimalPrice;
    res.optimalCurrentDurability    = optimalCurrentDurability;
    res.optimalMaxDurability        = optimalMaxDurability;
    res.optimalBattlesCount         = optimalBattlesCount;
    
    return res;
    
}


// Арты @reg
temp = "Лук света";
images[temp] = "http://dcdn3.heroeswm.ru/i/artifacts/lbow_s.jpg";
urls[temp]    = "cat=weapon&sort=0&art_type=lbow";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 70000;
lot.repair = 10100;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Кинжал пламени";
images[temp] = "http://dcdn2.heroeswm.ru/i/artifacts/super_dagger_b.jpg";
urls[temp]    = "cat=weapon&sort=0&art_type=super_dagger";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 210000;
lot.repair = 10400;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Кольцо холода";
images[temp] = "http://dcdn.heroeswm.ru/i/artifacts/coldring_b.jpg";
urls[temp]    = "cat=ring&sort=0&art_type=coldring_n";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 200000;
lot.duration = 0; // 3 часа
lot.repair = 6400;
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Клевер фортуны";
images[temp] = "http://dcdn3.heroeswm.ru/i/artifacts/clover_amul_s.jpg";
urls[temp]    = "cat=necklace&sort=0&art_type=clover_amul";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 90000;
lot.repair = 11000;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Меч холода";
images[temp] = "http://dcdn.heroeswm.ru/i/artifacts/cold_sword2014_s.jpg";
urls[temp]    = "cat=weapon&sort=0&art_type=cold_sword2014";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 70000;
lot.repair = 17600;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Плащ солнца";
images[temp] = "http://dcdn1.heroeswm.ru/i/artifacts/finecl_s.jpg";
urls[temp]    = "cat=cloack&sort=0&art_type=finecl";
lot = {};
lot.value = temp;
lot.amount = 1;
lot.price = 60000;
lot.repair = 10000;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Кинжал налётчика";
images[temp] = "http://dcdn1.heroeswm.ru/i/artifacts/tm_knife_s.jpg";
urls[temp]    = "cat=thief&sort=0&art_type=tm_knife";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 40000;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Амулет налётчика";
images[temp] = "http://dcdn3.heroeswm.ru/i/artifacts/tm_amulet_s.jpg";
urls[temp]    = "cat=thief&sort=0&art_type=tm_amulet";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 40000;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Лук зверобоя";
images[temp] = "http://dcdn3.heroeswm.ru/i/artifacts/sh/sh_bow_s.jpg";
urls[temp]    = "cat=weapon&sort=0&art_type=sh_bow";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 7000;
lot.duration = 0; // 3 часа
lot.repair = 2400;
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Рунный камень";
images[temp] = "http://dcdn1.heroeswm.ru/i/artifacts/events/runkam_b.jpg";
urls[temp]    = "cat=other&sort=0&art_type=runkam";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 14500;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Драконий камень";
images[temp] = "http://dcdn.heroeswm.ru/i/artifacts/events/dragonstone_b.jpg";
urls[temp]    = "cat=other&sort=0&art_type=dragonstone";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 25000;
lot.duration = 0; // 3 часа
lot.repair = 12000;
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Амулет битвы";
images[temp] = "http://dcdn2.heroeswm.ru/i/artifacts/wzzamulet16_s.jpg";
urls[temp]    = "cat=necklace&sort=0&art_type=wzzamulet16";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 11203;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Орден Тьмы";
images[temp] = "http://dcdn3.heroeswm.ru/i/artifacts/events/order_dark_b.jpg";
urls[temp]    = "cat=necklace&sort=0&art_type=ord_dark";
lot = {};
lot.value = temp;
lot.amount = 1;
lot.price = 29000;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Орден Грифона";
images[temp] = "http://dcdn3.heroeswm.ru/i/artifacts/events/order_griffin_b.jpg";
urls[temp]    = "cat=necklace&sort=0&art_type=order_griffin";
lot = {};
lot.value = temp;
lot.amount = 1;
lot.price = 50000;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Орден Света";
images[temp] = "http://dcdn3.heroeswm.ru/i/artifacts/events/order_light_b.jpg";
urls[temp]    = "cat=necklace&sort=0&art_type=ord_light";
lot = {};
lot.value = temp;
lot.amount = 1;
lot.price = 60000;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Шлем пламени";
images[temp] = "http://dcdn2.heroeswm.ru/i/artifacts/myhelmet15_s.jpg";
urls[temp]    = "cat=helm&sort=0&art_type=myhelmet15";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 6722;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

temp = "Плащ драконьего покрова";
images[temp] = "http://dcdn3.heroeswm.ru/i/artifacts/mascloack16_s.jpg";
urls[temp]    = "cat=cloack&sort=0&art_type=scloack16";
lot = {};
lot.value = temp;
lot.amount = 3;
lot.price = 3259;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Кираса благородства"] = "http://dcdn1.heroeswm.ru/i/artifacts/brsarmor16_s.jpg";
urls["Кираса благородства"]    = "cat=cuirass&sort=0&art_type=sarmor16";
lot = {};
lot.value = 'Кираса благородства';
lot.amount = 3;
lot.price = 4442;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Обсидиановая броня"] = "http://dcdn3.heroeswm.ru/i/artifacts/sarmor13_s.jpg";
urls["Обсидиановая броня"]    = "cat=cuirass&sort=0&art_type=sarmor13";
lot = {};
lot.value = 'Обсидиановая броня';
lot.amount = 3;
lot.price = 4413;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Мифриловые доспехи"] = "http://dcdn1.heroeswm.ru/i/artifacts/miff_plate_s.jpg";
urls["Мифриловые доспехи"]    = "cat=cuirass&sort=0&art_type=miff_plate";
lot = {};
lot.value = 'Мифриловые доспехи';
lot.amount = 3;
lot.price = 10049;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Обсидиановый щит"] = "http://dcdn.heroeswm.ru/i/artifacts/shield13_s.jpg";
urls["Обсидиановый щит"]    = "cat=shield&sort=0&art_type=shield13";
lot = {};
lot.value = 'Обсидиановый щит';
lot.amount = 3;
lot.price = 10388;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Сапоги благородства"] = "http://dcdn2.heroeswm.ru/i/artifacts/nmsboots16_s.jpg";
urls["Сапоги благородства"]    = "cat=boots&sort=0&art_type=sboots16";
lot = {};
lot.value = 'Сапоги благородства';
lot.amount = 3;
lot.price = 3307;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Терновое кольцо"] = "http://dcdn3.heroeswm.ru/i/artifacts/sring10_s.jpg";
urls["Терновое кольцо"]    = "cat=ring&sort=0&art_type=sring10";
lot = {};
lot.value = 'Терновое кольцо';
lot.amount = 3;
lot.price = 2919;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Амулет фортуны"] = "http://dcdn.heroeswm.ru/i/artifacts/samul141_s.jpg";
urls["Амулет фортуны"]    = "cat=necklace&sort=0&art_type=samul14";
lot = {};
lot.value = 'Амулет фортуны';
lot.amount = 3;
lot.price = 4462;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Кольцо боли"]       = "http://dcdn1.heroeswm.ru/i/artifacts/wwwring16_s.jpg";
urls["Кольцо боли"]       = "cat=ring&sort=0&art_type=wwwring16";
lot = {};
lot.value = 'Кольцо боли';
lot.amount = 3;
lot.price = 11475;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Кольцо хватки дракона"] = "http://dcdn.heroeswm.ru/i/artifacts/fgsring17_s.jpg";
urls["Кольцо хватки дракона"] = "cat=ring&sort=0&art_type=sring17";
lot = {};
lot.value = 'Кольцо хватки дракона';
lot.amount = 3;
lot.price = 2968;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Щит чешуи дракона"] = "http://dcdn3.heroeswm.ru/i/artifacts/zpsshield14_s.jpg";
urls["Щит чешуи дракона"] = "cat=shield&sort=0&art_type=sshield14";
lot = {};
lot.value = 'Щит чешуи дракона';
lot.amount = 3;
lot.price = 4006;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Шлем благородства"] = "http://dcdn.heroeswm.ru/i/artifacts/umshelm16_s.jpg";
urls["Шлем благородства"] = "cat=helm&sort=0&art_type=shelm16";
lot = {};
lot.value = 'Шлем благородства';
lot.amount = 1;
lot.price = 2832;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Обсидиановый меч"]  = "http://dcdn.heroeswm.ru/i/artifacts/ssword13_s.jpg";
urls["Обсидиановый меч"]  = "cat=weapon&sort=0&art_type=ssword13";
lot = {};
lot.value = 'Обсидиановый меч';
lot.amount = 1;
lot.price = 6111;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Меч гармонии"]  = "http://dcdn2.heroeswm.ru/i/artifacts/szzsword16_s.jpg";
urls["Меч гармонии"]  = "cat=weapon&sort=0&art_type=ssword16";
lot = {};
lot.value = 'Меч гармонии';
lot.amount = 1;
lot.price = 6178;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Лук полуночи"]  = "http://dcdn1.heroeswm.ru/i/artifacts/bow14_s.jpg";
urls["Лук полуночи"]  = "cat=weapon&sort=0&art_type=bow14";
lot = {};
lot.value = 'Лук полуночи';
lot.amount = 1;
lot.price = 10155;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Глаз дракона"]      = "http://dcdn3.heroeswm.ru/i/artifacts/warring13_s.jpg";
urls["Глаз дракона"]      = "cat=ring&sort=0&art_type=warring13";
lot = {};
lot.value = 'Глаз дракона';
lot.amount = 3;
lot.price = 10600;
lot.duration = 0; // 3 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["Руда"]              = "http://dcdn3.heroeswm.ru/i/ore.gif";
urls["Руда"]              = "cat=res&sort=0&type=2";
lot = {};
lot.value = 'Руда';
lot.amount = 50;
lot.price = 180;
lot.duration = 7; // 3 дня
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["ледяной кристалл"]  = "http://dcdn.heroeswm.ru/i/ice_crystal.gif";
urls["ледяной кристалл"]  = "cat=elements&sort=0&art_type=ice_crystal";
lot = {};
lot.value = 'ледяной кристалл';
lot.amount = 10;
lot.price = 7000;
lot.duration = 0; // 1/2 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["огненный кристалл"] = "http://dcdn.heroeswm.ru/i/fire_crystal.gif";
urls["огненный кристалл"] = "cat=elements&sort=0&art_type=fire_crystal";
lot = {};
lot.value = 'огненный кристалл';
lot.amount = 10;
lot.price = 7000;
lot.duration = 0; // 1/2 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["лунный камень"]     = "http://dcdn.heroeswm.ru/i/moon_stone.gif";
urls["лунный камень"]     = "cat=elements&sort=0&art_type=moon_stone";
lot = {};
lot.value = 'лунный камень';
lot.amount = 10;
lot.price = 7000;
lot.duration = 0; // 1/2 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["осколок метеорита"] = "http://dcdn.heroeswm.ru/i/meteorit.gif";
urls["осколок метеорита"] = "cat=elements&sort=0&art_type=meteorit";
lot = {};
lot.value = 'осколок метеорита';
lot.amount = 10;
lot.price = 7000;
lot.duration = 0; // 1/2 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["цветок ветров"]     = "http://dcdn.heroeswm.ru/i/wind_flower.gif";
urls["цветок ветров"]     = "cat=elements&sort=0&art_type=wind_flower";
lot = {};
lot.value = 'цветок ветров';
lot.amount = 10;
lot.price = 7000;
lot.duration = 0; // 1/2 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

images["клык тигра"]        = "http://dcdn.heroeswm.ru/i/tiger_tusk.gif";
urls["клык тигра"]        = "cat=elements&sort=0&art_type=tiger_tusk";
lot = {};
lot.value = 'клык тигра';
lot.amount = 10;
lot.price = 7000;
lot.duration = 0; // 1/2 часа
lot.quantity = getQuantity(lot.value, lot.amount);
fastLots.push(lot);

// !reg

document.styleSheets[0].insertRule(".selected_lot { padding-top: 5px; padding-bottom: 5px; background-color: rebeccapurple; }", 0);

elem_form = getUniqueElementByXPath("//form[@name='f']");

for (i = 0; i < fastLots.length; i++) {
	addFastLot(fastLots[i]);
}


