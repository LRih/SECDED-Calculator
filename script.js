$(function()
{
    $("input[name='create_secded']").keypress(function(e)
    {
        if (e.which == 13)
        {
            var div = $("#solution");
            div.html(GetCreateSECDEDString($(this).val()));
            div.css('display', 'block');
        }
    });
    
    $("input[name='check_secded']").keypress(function(e)
    {
        if (e.which == 13)
        {
            var div = $("#solution");
            div.html(GetCheckSECDEDString($(this).val()));
            div.css('display', 'block');
        }
    });
});
//============================================================================= FUNCTIONS
function GetCreateSECDEDString(bits)
{
    // only accept binary string
    if (bits.match(/^[10]+$/g) == null)
        return "<div class='heading'>Input must be a binary string</div>";
    
    var result = "<div class='heading'>Create SECDED: " + GetFormattedBits(bits) + "</div>";
    bits = Reverse(bits); // easier to work with reversed bits
    
    var parityCount = GetParityBitCount(bits);
    result += GetParityBitCountString(parityCount, bits.length);
    result += GetParityCalculationString(bits, parityCount);
    
    return result;
}
function GetParityCalculationString(bits, parityCount)
{
    var result = "<div class='subheading'>Parity calculation</div>";
    for (var p = 0; p < parityCount; p++) // insert placeholder parity bits
        bits = InsertString(bits, "?", Math.pow(2, p) - 1);
    result += Reverse(bits).replace(/\?/g, "<span class='red'>?</span>") + "<br><br>";
    
    // calculate P1+
    for (var p = 0; p < parityCount; p++)
    {
        var checkBitPositions = GetCheckBitPositions(bits, p);
        var checkBits = GetString(bits, checkBitPositions);
        var oneCount = GetCharCount(checkBits, "1");
        var evenOdd = (oneCount % 2 == 0 ? "EVEN" : "ODD");
        var evenOddValue = (oneCount % 2 == 0 ? "0" : "1");
        bits = ReplaceAt(bits, evenOddValue, checkBitPositions[0] - 1);
        result += "P" + (p + 1) + " (" + checkBitPositions + "):<br>";
        result += "&nbsp&nbsp&nbsp&nbsp" + checkBits + ", " + evenOdd + " P" + (p + 1) + " is " + evenOddValue + "<br>";
    }
    // calculate P0
    var oneCount = GetCharCount(bits, "1");
    var evenOdd = (oneCount % 2 == 0 ? "EVEN" : "ODD");
    var evenOddValue = (oneCount % 2 == 0 ? "0" : "1");
    result += "Total 1s is " + evenOdd + ", P0 is " + evenOddValue + "<br>";
    bits = evenOddValue + bits;
    
    // display final secded
    bits = Reverse(bits);
    result += "<br><div class='subheading'>Final SECDED</div>";
    result += GetFormattedBits(bits) + "<sub>2</sub><br>";
    result += "#" + parseInt(bits, 2).toString(16) + "<sub>16</sub>";
    
    return result;
}


function GetCheckSECDEDString(bits)
{
    // only accept binary string
    if (bits.match(/^([0-9A-Fa-f]+|[10]+)$/g) == null)
        return "<div class='heading'>Input must be a hex or binary string</div>";
    
    var result = "<div class='heading'>Check SECDED: " + GetFormattedBits(bits) + "</div>";
    
    // convert hex to binary and display
    if (bits.match(/^[0-9A-Fa-f]+$/g) != null && bits.match(/^[2-9A-Fa-f]+$/g) != null)
    {
        bits = parseInt(bits, 16).toString(2);
        result += GetFormattedBits(bits) + "<br>";
    }
    
    bits = Reverse(bits); // easier to work with reversed bits
    
    var parityCount = GetSECDEDParityBitCount(bits);
    result += GetParityBitCountString(parityCount, bits.length - parityCount - 1);
    result += GetSECDEDParityCalculationString(bits, parityCount);
    
    return result;
}
function GetSECDEDParityCalculationString(bits, parityCount)
{
    var result = "<div class='subheading'>Parity check</div>";
    var isP0Even = GetCharCount(bits, "1") % 2 == 0;
    if (isP0Even) result += "P0: total 1s is EVEN, either no error or 2-bit error<br>";
    else result += "P0: total 1s is ODD, 1-bit error<br>";
    
    // calculate P1+
    var errorPositions = [];
    for (var p = 0; p < parityCount; p++)
    {
        var checkBitPositions = GetCheckBitPositions(bits, p);
        var checkBits = GetString(bits.substring(1), checkBitPositions);
        var isEven = GetCharCount(checkBits, "1") % 2 == 0;
        var evenOdd = (isEven ? "EVEN" : "ODD");
        var evenOddValue = (isEven ? " is OK" : " contains <span class='red'>ERROR</span>");
        if (!isEven) errorPositions.push(checkBitPositions);
        result += "P" + (p + 1) + " (" + checkBitPositions + "):<br>";
        result += "&nbsp&nbsp&nbsp&nbsp" + checkBits + ", " + evenOdd + " P" + (p + 1) + evenOddValue + "<br>";
    }
    if (isP0Even)
    {
        if (errorPositions.length > 0)
        {
            result += "P0 reports OK and P1+ reports error, thus there is a 2-bit error and cannot be corrected<br>";
            return result;
        }
        else
            result += "There is no error<br>";
    }
    else
    {
        var pos = GetIntersection(errorPositions);
        if (pos == -1)
        {
            result += "P0 reports error and P1+ reports an invalid case<br>";
            return result;
        }
        else if (errorPositions.length > 0)
        {
            bits = ReplaceAt(bits, bits.charAt(pos) == "1" ? "0" : "1", pos)
            result += "1-bit error at bit " + pos + "<br>";
        }
        else
        {
            result += "P0 reports error and P1+ reports OK, this is an invalid case<br>";
            return result;
        }
    }
    
    // display corrected secded
    bits = Reverse(bits);
    result += "<br><div class='subheading'>Corrected SECDED</div>";
    result += GetFormattedBits(bits) + "<sub>2</sub>";
    result += "<br>" + "#" + parseInt(bits, 2).toString(16) + "<sub>16</sub>";
    result += "<br>Data: " + GetFormattedBits(GetData(bits)) + "<sub>2</sub>";
    result += "<br>Data: " + parseInt(GetData(bits), 2).toString(10) + "<sub>10</sub> (corresponds to 'unknown')"; // only when 0-127
    return result;
}
function GetP0CheckString(bits)
{
    var checkP0 = GetCharCount(bits, "1");
    if (checkP0 % 2 == 0) return "P0: total 1s is EVEN, either no error or 2-bit error";
    else return "P0: total 1s is ODD, 1-bit error";
}

function GetParityBitCountString(parityCount, dataCount)
{
    var result = "<div class='subheading'>Parity bit count: " + parityCount + "</div>";
    result += "2<sup>p</sup> >= p + d + 1<br>";
    result += "2<sup>" + parityCount + "</sup> >= " + parityCount + " + " + dataCount + " + 1<br>";
    result += Math.pow(2, parityCount) + " >= " + (parityCount + dataCount + 1) + "<br><br>";
    return result;
}


function GetCheckBitPositions(bits, parityBitNumber)
{
    var checkBits = [];
    var pos = Math.pow(2, parityBitNumber);
    for (var i = 1; i <= bits.length; i++)
        if ((i & pos) > 0) checkBits.push(i);
    return checkBits;
}
function GetSECDEDParityBitCount(bits)
{
    var p;
    for (p = 0; Math.pow(2, p) < bits.length; p++);
    return p;
}
function GetParityBitCount(bits)
{
    var p;
    for (p = 0; Math.pow(2, p) < p + bits.length + 1; p++);
    return p;
}
function GetData(secded)
{
    var result = "";
    secded = Reverse(secded);
    for (var i = 0; i < secded.length; i++)
    {
        if (i != 0 && (i & (i - 1)) != 0)
            result += secded.charAt(i);
    }
    return Reverse(result);
}
function GetFormattedBits(bits)
{
    return Reverse(Reverse(bits).replace(/(.{4}(?!$))/g, "$1 "));
}


function GetIntersection(arrayArray)
{
    if (arrayArray.length == 0)
        return -1;
    var targetCount = arrayArray.length - 1;
    for (var i = 0; i < arrayArray[0].length; i++)
    {
        var test = arrayArray[0][i];
        var count = 0;
        for (var j = 1; j < arrayArray.length; j++)
            if (arrayArray[j].indexOf(test) != -1) count++;
        if (targetCount == count) return test;
    }
    return -1;
}
function GetCharCount(string, character)
{
    var count = 0;
    for (var i = 0; i < string.length; i++)
        if (string.charAt(i) == character) count++;
    return count;
}
function GetString(string, positions)
{
    var result = "";
    for (var i = 0; i < positions.length; i++)
        result += string.charAt(positions[i] - 1);
    return result;
}
function ReplaceAt(source, newString, index)
{
    return source.substring(0, index) + newString + source.substring(index + newString.length);
}
function InsertString(source, newString, index)
{
    return source.substring(0, index) + newString + source.substring(index);
}
function Reverse(string)
{
    return string.split("").reverse().join("");
}