const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
test('date-based shared filenames reserve distinct files and reject unsafe paths',()=>{
 const original=fs.readFileSync(path.join(__dirname,'../android/MainActivity.java'),'utf8');
 const start=original.indexOf('    // BEGIN save naming helpers:');
 const end=original.indexOf('    // END save naming helpers.');
 assert.ok(start>=0&&end>start);
 const code=original.slice(start,end);
 const program=`import java.io.*;import java.text.*;import java.util.*;import java.nio.file.*;public class NameCheck {\n${code}\npublic static void main(String[] a) throws Exception {TimeZone.setDefault(TimeZone.getTimeZone("UTC")); Date when=new Date(0); File dir=Files.createTempDirectory("uw2-names").toFile(); File first=reserveShareFile(dir,when); Files.write(first.toPath(),new byte[]{7});File second=reserveShareFile(dir,when);if(!first.getName().equals("UW2-1970-01-01_00-00-00.uw2save.json")||!second.getName().equals("UW2-1970-01-01_00-00-00-01.uw2save.json"))throw new AssertionError("names");if(Files.readAllBytes(first.toPath())[0]!=7)throw new AssertionError("overwritten");if(!isSharedSaveName(first.getName())||!isSharedSaveName(second.getName())||!isSharedSaveName("UW2-20261114-123456-0123456789abcdef0123456789abcdef.uw2save.json")||isSharedSaveName("../"+first.getName())||isSharedSaveName("other.json"))throw new AssertionError("validation");first.delete();second.delete();dir.delete();}}`;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'uw2-naming-test-'));try{fs.writeFileSync(path.join(dir,'NameCheck.java'),program);const jdk=process.env.JAVA_HOME||'/Applications/Android Studio.app/Contents/jbr/Contents/Home';execFileSync(path.join(jdk,'bin/javac'),['-d',dir,path.join(dir,'NameCheck.java')]);execFileSync(path.join(jdk,'bin/java'),['-cp',dir,'NameCheck']);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
