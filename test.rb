require 'rexml/document'

class MyModel
  attr_accessor :params, :bind
  def initialize
    @params = Set.new
    @bind = Hash.new
  end
end

# コメント化
def comment(str) "/* #{str} */" end

# ドキュメント
def create_header_doc(array)
  ret = "/**\n"
  array.each do |e|
    ret += "   #{e}\n"
  end
  ret += " */"
  return ret
end

# 開始タグ
def tag_open(e)
  ret = "<"
  ret += "#{e.name}"
  e.attributes.each do |k, v|
    ret += " #{k}=\"#{v}\""
  end
  ret += " /" if e.children.empty?
  ret += ">"
  return comment(ret)
end

# 終了タグ
def tag_close(e) e.children.empty? ? "" : comment("</#{e.name}>") end

# 直前のコメントを取得
def prev_comment(el)
  ret = ""
  id = el.attributes['id']
  children = el.parent.children
  children.to_a.each_with_index do |e, i|
    if (e.class == REXML::Element && e.attributes['id'] == id && i > 0) then
      for j in 0..i-1
        child = children[i-j-1]
        case child
        when REXML::Comment then
          ret = child.to_s.strip + "\n" + ret
        when REXML::Element then
          break
        end
      end
    end
  end
  return ret
end

# Trim処理
def trim(child_str, options)
  prefix = options[:prefix]
  prefixOverrides = options[:prefixOverrides]
  prefixOverrides = prefixOverrides.split("|").map do |e|
    Regexp.escape(e)
  end.join("|") if prefixOverrides

  suffix = options[:suffix]
  suffixOverrides = options[:suffixOverrides]
  suffixOverrides = suffixOverrides.split("|").map do |e|
    Regexp.escape(e)
  end.join("|") if suffixOverrides

  regex_comment_multi = /(\/\*(.*?)\*\/)/im
  regex_comment_row = /(--.*?\n)/im
  regex_comment = /(\s*(#{regex_comment_multi}|#{regex_comment_row})\s*)/im
  regex_comments = /(?<comments>#{regex_comment}*?)/im
  regex_comment_prefix = /\A#{regex_comments}(?<prefixOverrides>#{prefixOverrides})(?<spaces>\s*)/im
  regex_comment_suffix = /(?<spaces>\s*)(?<suffixOverrides>#{suffixOverrides})#{regex_comments}\Z/im

  if prefixOverrides then
    child_str.match(/#{regex_comment_prefix}/im) do |m|
        child_str = child_str.sub(/#{regex_comment_prefix}/im, "#{m[:comments]}#{m[:spaces]}")
    end
  end

  if suffixOverrides && rindex = child_str.rindex(/#{regex_comment_suffix}/im) then
      tempstr = child_str[rindex .. child_str.size]
      child_str.match(/#{regex_comment_suffix}/im, rindex) do |m|
        tempstr = tempstr.sub(/#{regex_comment_suffix}/im, "#{m[:spaces]}#{m[:comments]}")
        child_str = child_str[0 ... rindex] + tempstr
      end
  end

  if !child_str.gsub(/#{regex_comment}/im, '').strip.empty? then
    child_str = "#{prefix} #{child_str}" if prefix
    child_str = "#{child_str} #{suffix}" if suffix
  end

  return child_str
end

# クエリ生成
def create_query(e, instr, model)
  ret = instr

  case e.name when "select", "insert", "update", "delete", "sql", "include" then
  else
    ret += tag_open(e)
  end

  case e.name
  when "include" then
    refid = e.attributes["refid"]
    refsql = e.root_node.elements["mapper/sql[@id='#{refid}']"]
    if refsql then
      ret += comment("#{e.to_s} : start")
      ret += create_query(e.root_node.elements["mapper/sql[@id='#{refid}']"], instr, model) + "\n"
      ret += comment("#{e.to_s} : end")
    else
      ret += "/* ######### Not found. refid=\"#{refid}\" ######### */"
    end

  when "foreach" then
    if e.attributes["open"] then
      ret += " " + e.attributes["open"]
    end
    model.params.add(e.attributes["collection"])
  when "bind" then
    model.bind = Hash[ e.attributes["name"] => e.attributes["value"]]
  end

  child_str = ""
  # 子要素
  e.children.each do |c|
    case c
    when REXML::Text then
      regex = /[\#\$]{\s*
        (?<param_full>
          (?<param_first>\w+)?
          (\s*\.\s*\w+)*?
          (\s*\.\s*)?
          (?<param>\w+)?
        )
        \s*
        (,\s*\w+=(?<jdbc_type>\w+))*}/x
      tempstr = c.value
      pos = 0
      while match = tempstr.match(regex, pos) do
        index = tempstr.index(match[0])
        if model.bind.include? match[:param_full]  then
          after = model.bind[match[:param_full]]
        else
          after = "@#{match[:param] ? match[:param] : match[:param_full]}"
        end
        after += " #{comment(match[0])}"
        tempstr = tempstr.sub(match[0], after)
        param_full = match[:param_full]
        if e.name == "foreach" then
          param_full = param_full.sub(e.attributes["item"], e.attributes["collection"]).sub(/(#{e.attributes["collection"]})\./im, '\1_')
        end
        if !model.bind.include? match[:param_full]  then
          model.params.add(param_full)
        end
        pos = index + after.size
      end
      child_str += tempstr
    when REXML::Comment then
      child_str += comment("#{c.to_s}")
    when REXML::Element then
      child_str += create_query(c, instr, model)
    else puts "else / #{e.name}"
    end
  end

  case e.name
  when "where" then
    options = {prefix: e.name, prefixOverrides: "AND |OR "}
    child_str = trim(child_str, options)
  when "set" then
    options = {prefix: e.name, suffixOverrides: ","}
    child_str = trim(child_str, options)
  when "trim" then
    options = Hash[e.attributes.map { |k, v| [k.to_sym, v] }]
    child_str = trim(child_str, options)
  when "when", "otherwise" then
    if e.parent.elements["when"] != e then
      child_str = child_str.split("\n").map { |c|
                  !c.strip.empty?() ? "-- " + c : c
                }.join("\n")
    end
  end
  ret += child_str

  # 後処理
  case e.name
  when "select", "insert", "update", "delete", "sql" then
  when "foreach" then
    if e.attributes["close"] then
      ret += e.attributes["close"]
    end
    ret += tag_close(e)
  else
    ret += tag_close(e)
  end

  return ret
end

def create_out_file_name(file_name)
  out_file_name = File.basename(file_name).sub(/#{File.extname(file_name)}$/, ".sql")
  return File.dirname(file_name) + "/" + out_file_name
end

def parse_mapper(doc)
  ret = ""
  # mapper抽出
  doc.elements.each('mapper/*') do |e|
    case e.name
    when 'select', 'insert', 'update', 'delete' then

      if e.comments[0].to_s.include?("@mbggenerated") then
        next
      end

      str = ""

      header = []
      # 直前のコメントを取得
      header += prev_comment(e).split("\n")
      # 属性を格納
      e.attributes.each do |i, v|
        header.push("#{i}: #{v}")
      end
      model = MyModel.new
      # クエリ生成
      query = create_query(e, "", model)
      header += model.params.map { |p| "@param #{p}" }.to_a

      str += create_header_doc(header)
      puts str += query + ";\n\n"
      ret += str
    end
  end
  return ret
end

# 処理実行
def exec(in_file_name)
  puts "parse file: #{in_file_name}"
  # XMLでない場合は終了
  if File.extname(in_file_name) != ".xml" then
    puts "The extention is not '.xml'"
    return
  end

  # ファイル読み込み
  doc = REXML::Document.new(open(in_file_name))
  str = "-- #{in_file_name}\n"
  str += parse_mapper(doc)

  # 出力
  out_file_name = create_out_file_name(in_file_name)
  puts "output file: #{out_file_name}"
  # File.write(out_file_name, str)
end

# テスト用ファイル名
file_name = "mapper.xml"
args = ARGV.empty? ? [file_name] : ARGV
args.each do |arg|
  #実行
  exec(arg)
end
