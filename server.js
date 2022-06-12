import { serve } from "https://deno.land/std@0.138.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.138.0/http/file_server.ts";

let previousWord = "しりとり";

let score = 0; //続けた回数
let totalLength = 0; //文字数
let recent = new Set();

console.log("Listening on http://localhost:8000");

serve(async (req) => {
    const pathname = new URL(req.url).pathname;
    console.log(pathname);

    if (req.method === "GET" && pathname === "/shiritori") {
        return new Response(previousWord);
    }

    if (req.method === "POST" && pathname === "/shiritori") {
        let requestJson = await req.json();
        let nextWord = requestJson.nextWord;

        // ひらがな・カタカナ以外を検知 //
        if (!isValid(nextWord)) {
            return new Response("ひらがな・カタカナ以外は入力できません。", { status: 400 });
        }

        let prev = kata2hira(previousWord); //ひらがなにすべて変換
        let next = kata2hira(nextWord); ////ひらがなにすべて変換

        // 空文字列ならば //
        if (next.length === 0) {
            return new Response("文字を入力してください。", { status: 400 });
        }

        // 前の単語に続いていなかったら //
        if (prev.charAt(prev.length - 1) !== next.charAt(0)) {
            return new Response("前の単語に続いていません。", { status: 400 });
        }

        // 'ん' で終わった場合すべてをリセット //
        if (next.endsWith('ん')) {
            previousWord = "しりとり";
            score = 0;
            totalLength = 0;
            recent = new Set();

            return new Response("「ん」で終わる単語を言いました！", { status: 418 });
        }

        // Set に既に格納済みならばreturn //
        if (recent.has(nextWord)) {
            return new Response(`「${nextWord}」は既に発言済みです。`, { status: 400 });
        }

        // 追加 //
        score += 1;
        totalLength += nextWord.length;
        recent.add(nextWord);

        previousWord = nextWord;
        return new Response(`${score},${totalLength},${previousWord}`);
    }

    return serveDir(req, {
        fsRoot: "public",
        urlRoot: "",
        showDirListing: true,
        enableCors: true,
    });
});

/* 文字列を構成する全ての文字が有効範囲内か？ */
function isValid(s) {
    for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);

        if (c < 0x3040 || c > 0x30FF)
            return false;
    }

    return true;
}

/* カタカナ → ひらがな の変換 */
function kata2hira(s) {
    let result = "";

    for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);
        let d = s.charAt(i);

        if (c >= 0x30A0 && c <= 0x30FF) {
            result += String.fromCharCode(c - 96);
        } else {
            result += String.fromCharCode(c);
        }
    }

    return result;
}