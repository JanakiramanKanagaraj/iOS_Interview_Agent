"""Extract uploaded resume text in memory. No files, macros or document instructions run."""
import sys,io,json,zipfile,xml.etree.ElementTree as ET
kind=sys.argv[1]
raw=sys.stdin.buffer.read(5*1024*1024+1)
try:
 if len(raw)>5*1024*1024:raise ValueError('File exceeds the 5 MB limit.')
 if kind=='pdf':
  if not raw.lstrip().startswith(b'%PDF-'):raise ValueError('This is not a valid PDF file.')
  import pdfplumber
  with pdfplumber.open(io.BytesIO(raw)) as pdf:
   if len(pdf.pages)>20:raise ValueError('Use a resume with at most 20 pages.')
   text='\n\n'.join(p.extract_text() or '' for p in pdf.pages)
 elif kind=='docx':
  with zipfile.ZipFile(io.BytesIO(raw)) as z:
   info=z.getinfo('word/document.xml')
   if info.file_size>2*1024*1024:raise ValueError('The document content is too large.')
   root=ET.fromstring(z.read(info))
   ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
   text='\n'.join(''.join(p.itertext()) for p in root.findall('.//w:p',ns))
 else:text=raw.decode('utf-8-sig')
 text=text.replace('\x00','').strip()
 if len(text)<30:raise ValueError('No readable resume text was found. For a scanned PDF, paste OCR text into the resume preview instead.')
 print(json.dumps({'text':text[:16000],'truncated':len(text)>16000,'totalCharacters':len(text)}))
except ModuleNotFoundError:
 print(json.dumps({'error':'PDF extraction needs pdfplumber in the configured Python runtime. You can upload DOCX/TXT or paste your resume text.'}))
except ValueError as e:print(json.dumps({'error':str(e)}))
except Exception:print(json.dumps({'error':'This document could not be read. Try an unencrypted PDF, DOCX or UTF-8 TXT file.'}))
