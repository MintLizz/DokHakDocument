import java.awt.*;
import java.awt.event.*;
import javax.swing.*;

public class Sudoku {

    class Tile extends JButton{
        int r;
        int c;

        Tile(int r, int c) {
            this.r = r;
            this.c = c;
        }
    }

	int boardWidth = 600;
	int boardHeight = 650;

    String[] puzzle = {
        "--74916-5",
        "2---6-3-9",
        "-----7-1-",
        "-586----4",
        "--3----9-",
        "--62--187",
        "9-4-7---2",
        "67-83----",
        "81--45---"
    };

    String[] solution = {
        "387491625",
        "241568379",
        "569327418",
        "758619234",
        "123784596",
        "496253187",
        "934176852",
        "675832941",
        "812945763"
    };
	
	JFrame frame = new JFrame();
	JLabel textLabel = new JLabel();
	JPanel textPanel = new JPanel();
    JPanel boardPanel = new JPanel();
    JPanel buttonsPanel = new JPanel();

    JButton numselected = null;
    int errors = 0;
    
	Sudoku() {

		frame.setSize(boardWidth, boardHeight);
		frame.setResizable(false);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		// 얘는 윈도우 창에서 어느 위치에 화면을 보여줄 지
		// null인 경우 디폴트로 가운데 배치
		frame.setLocationRelativeTo(null);
		
		// 얘는 해당 버튼이나 기능을 레이아웃에서 배치 가능함
		// 동서남북순으로
		frame.setLayout(new BorderLayout());
		
		textLabel.setFont(new Font("Arial", Font.BOLD, 30));
		textLabel.setHorizontalAlignment(JLabel.CENTER);
		textLabel.setText("Sudoku: 0");
		
		textPanel.add(textLabel);
		frame.add(textPanel, BorderLayout.NORTH);

        boardPanel.setLayout(new GridLayout(9,9));

        setUpTiles();
        frame.add(boardPanel, BorderLayout.CENTER);

        buttonsPanel.setLayout(new GridLayout(1, 9));
        setupButtons();

        frame.add(buttonsPanel, BorderLayout.SOUTH);

        // 창을 화면에 나타낼것인지
        frame.setVisible(true);
	}

    void setUpTiles() {
        for(int r=0; r < 9; r++) { // 0,1,2,3,4,5,6,7,8
            for(int c=0; c < 9; c++) { // 0,1,2,3,4,5,6,7,8
                Tile tile = new Tile(r, c);
                char tileChar = puzzle[r].charAt(c);
                
                if( tileChar != '-') {
                    tile.setFont(new Font("Arials", Font.BOLD, 20));
                    tile.setText(String.valueOf(tileChar));
                    tile.setBackground(Color.lightGray);
                }
                else {
                    tile.setFont(new Font("Arial", Font.PLAIN, 20));
                    tile.setBackground(Color.white);
                }

                if((r==2 && c == 2) || (r==2 && c==5) || (r==5 && c ==2) || (r==5 && c==5)) {
                    tile.setBorder(BorderFactory.createMatteBorder(1,1,5,5,Color.black));
                }else if( r == 2 || r == 5) {
                    tile.setBorder(BorderFactory.createMatteBorder(1,1,5,1,Color.black));
                } else if( c == 2 || c == 5) {
                    tile.setBorder(BorderFactory.createMatteBorder(1,1,1,5,Color.black));
                }else {
                    tile.setBorder(BorderFactory.createLineBorder(Color.black));
                }

                tile.setFocusable(false);
                boardPanel.add(tile);

                tile.addActionListener(new ActionListener() {
                    public void actionPerformed(ActionEvent e){
                        Tile tile = (Tile) e.getSource();
                        int r = tile.r;
                        int c = tile.c;
                        if(numselected != null){
                            if(tile.getText() != ""){
                                return;
                            }
                            String numSelectedText = numselected.getText();
                            String tileSolution = String.valueOf(solution[r].charAt(c));
                            if(tileSolution.equals(numSelectedText) ) {
                                tile.setText(numSelectedText);
                            }else {
                                errors += 1;
                                textLabel.setText("Sudoku : " + String.valueOf(errors));
                            }
                        }

                    }
                });
                
            }
        }
    }

    void setupButtons() {
        for(int i=0; i < 10; i++) {
            JButton button = new JButton();
            button.setFont(new Font("Arial", Font.BOLD, 20));
            // String.valueOf() 란 문자열로 바꾸어주는 것
            button.setText(String.valueOf(i));
            button.setFocusable(false);
            button.setBackground(Color.white);
            buttonsPanel.add(button);

            button.addActionListener(new ActionListener() {
               public void actionPerformed(ActionEvent e){
                JButton button = (JButton) e.getSource();

                if(numselected != null){
                    numselected.setBackground(Color.white);
                }

                numselected = button;
                numselected.setBackground(Color.lightGray);
            } 
            });
        }
    }

}